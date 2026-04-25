-- Migration: table realisations + RLS + triggers
-- Date: 2026-04-25
-- Description: backend du module Réalisations Effinor.
--   * Table realisations : chantiers réalisés publiés sur effinor.fr/realisations
--   * RLS : SELECT public si published+date passée, ALL pour staff marketing
-- Pré-requis :
--   * fonction current_user_has_role_code (cf. 20260411130000_cee_sheet_workflows.sql)
--   * rôle marketing_manager (cf. 20260425190000_add_marketing_manager_role.sql)
--   * bucket marketing-media (cf. 20260425190100_create_blog_articles.sql)

BEGIN;

-- ============================================================
-- ENUM realisation_status
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'realisation_status') THEN
    CREATE TYPE public.realisation_status AS ENUM (
      'draft',
      'published',
      'archived'
    );
  END IF;
END$$;

COMMENT ON TYPE public.realisation_status IS
  'Statut réalisation : draft = brouillon, published = publié, archived = archivé';

-- ============================================================
-- TABLE realisations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.realisations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL    DEFAULT now(),
  updated_at       timestamptz NOT NULL    DEFAULT now(),
  published_at     timestamptz NULL,

  -- Contenu
  slug             text        UNIQUE NOT NULL,
  title            text        NOT NULL,
  excerpt          text        NOT NULL,
  description_html text        NOT NULL DEFAULT '',

  -- Localisation
  city             text        NOT NULL,
  postal_code      text        NULL,
  region           text        NULL,

  -- Projet
  service_type     text        NOT NULL,
  surface_m2       int         NULL,
  year_completed   int         NULL,

  -- Financier
  total_cost_eur   int         NULL,
  total_aids_eur   int         NULL,

  -- Médias
  cover_image_url  text        NULL,
  cover_image_alt  text        NULL,
  gallery_urls     text[]      NOT NULL DEFAULT '{}',

  -- État
  status           public.realisation_status NOT NULL DEFAULT 'draft',
  featured         boolean     NOT NULL DEFAULT false,

  -- Contraintes
  CONSTRAINT realisations_slug_format
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT realisations_service_type_valid
    CHECK (service_type IN ('pac-maison','pac-immeuble','ssc','renovation-globale')),
  CONSTRAINT realisations_year_valid
    CHECK (year_completed IS NULL OR (year_completed >= 2015 AND year_completed <= 2030)),
  CONSTRAINT realisations_title_not_empty
    CHECK (length(trim(title)) > 0),
  CONSTRAINT realisations_city_not_empty
    CHECK (length(trim(city)) > 0)
);

COMMENT ON TABLE public.realisations IS
  'Réalisations clients Effinor. Publiées sur effinor.fr/realisations quand status=published.';
COMMENT ON COLUMN public.realisations.service_type IS
  'pac-maison | pac-immeuble | ssc | renovation-globale';
COMMENT ON COLUMN public.realisations.gallery_urls IS
  'URLs photos additionnelles (Supabase Storage bucket marketing-media).';
COMMENT ON COLUMN public.realisations.description_html IS
  'HTML simple (h2, p, ul, strong) — pas de TipTap.';

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_realisations_published
  ON public.realisations (published_at DESC)
  WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_realisations_status
  ON public.realisations (status);

CREATE INDEX IF NOT EXISTS idx_realisations_service_type
  ON public.realisations (service_type);

CREATE INDEX IF NOT EXISTS idx_realisations_featured
  ON public.realisations (featured)
  WHERE featured = true;

-- ============================================================
-- TRIGGER : auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_realisations_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_realisations_updated_at ON public.realisations;
CREATE TRIGGER trg_realisations_updated_at
  BEFORE UPDATE ON public.realisations
  FOR EACH ROW EXECUTE FUNCTION public.set_realisations_updated_at();

-- ============================================================
-- TRIGGER : auto-set / clear published_at suivant status
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_realisations_published_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published'
     AND OLD.status IS DISTINCT FROM 'published'
     AND NEW.published_at IS NULL
  THEN
    NEW.published_at := now();
  END IF;
  IF NEW.status <> 'published' AND OLD.status = 'published' THEN
    NEW.published_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_realisations_published_at ON public.realisations;
CREATE TRIGGER trg_realisations_published_at
  BEFORE UPDATE ON public.realisations
  FOR EACH ROW EXECUTE FUNCTION public.set_realisations_published_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.realisations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realisations_select_public" ON public.realisations;
CREATE POLICY "realisations_select_public"
  ON public.realisations FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

DROP POLICY IF EXISTS "realisations_all_staff" ON public.realisations;
CREATE POLICY "realisations_all_staff"
  ON public.realisations FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role_code('super_admin')
    OR public.current_user_has_role_code('admin')
    OR public.current_user_has_role_code('marketing_manager')
  )
  WITH CHECK (
    public.current_user_has_role_code('super_admin')
    OR public.current_user_has_role_code('admin')
    OR public.current_user_has_role_code('marketing_manager')
  );

-- ============================================================
-- GRANTS
-- ============================================================
GRANT SELECT ON public.realisations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.realisations TO authenticated;

COMMIT;
