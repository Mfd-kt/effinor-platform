-- Migration: table testimonials + RLS
-- Date: 2026-04-25
-- Témoignages clients (home effinor.fr), CRUD ERP.

BEGIN;

-- ============================================================
-- ENUM testimonial_status
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'testimonial_status') THEN
    CREATE TYPE public.testimonial_status AS ENUM (
      'draft',
      'published',
      'archived'
    );
  END IF;
END$$;

COMMENT ON TYPE public.testimonial_status IS
  'Statut témoignage : draft, published, archived';

-- ============================================================
-- TABLE testimonials
-- ============================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL    DEFAULT now(),
  updated_at       timestamptz NOT NULL    DEFAULT now(),
  published_at     timestamptz NULL,

  author_name      text        NOT NULL,
  author_city      text        NOT NULL,
  author_initials  text        NOT NULL,
  rating           int         NOT NULL,
  text             text        NOT NULL,
  service_type     text        NOT NULL,
  date_label       text        NOT NULL,
  featured         boolean     NOT NULL DEFAULT false,
  status           public.testimonial_status NOT NULL DEFAULT 'draft',

  CONSTRAINT testimonials_rating_range CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT testimonials_author_name_not_empty CHECK (length(trim(author_name)) > 0),
  CONSTRAINT testimonials_text_not_empty CHECK (length(trim(text)) > 0)
);

COMMENT ON TABLE public.testimonials IS
  'Avis clients publiés sur la page d''accueil quand status=published.';

CREATE INDEX IF NOT EXISTS idx_testimonials_status
  ON public.testimonials (status);

CREATE INDEX IF NOT EXISTS idx_testimonials_published
  ON public.testimonials (published_at DESC)
  WHERE published_at IS NOT NULL;

-- updated_at
CREATE OR REPLACE FUNCTION public.set_testimonials_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER trg_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.set_testimonials_updated_at();

-- published_at (même logique que blog_articles)
CREATE OR REPLACE FUNCTION public.set_testimonials_published_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published')
     AND NEW.published_at IS NULL
  THEN
    NEW.published_at := now();
  END IF;
  IF NEW.status <> 'published' AND TG_OP = 'UPDATE' AND OLD.status = 'published' THEN
    NEW.published_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_testimonials_published_at ON public.testimonials;
CREATE TRIGGER trg_testimonials_published_at
  BEFORE INSERT OR UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.set_testimonials_published_at();

-- ============================================================
-- SEED : 3 placeholders en brouillon (aligné testimonials-data.ts)
-- ============================================================
INSERT INTO public.testimonials (
  author_name,
  author_city,
  author_initials,
  rating,
  text,
  service_type,
  date_label,
  featured,
  status
)
SELECT v.*
FROM (VALUES
  (
    'Sophie L.',
    'Lyon (69)',
    'SL',
    5,
    'Accompagnement de bout en bout, équipe à l''écoute et chantier propre. Ma facture de chauffage a baissé de 60% dès le premier hiver. Je recommande Effinor sans hésiter.',
    'Pompe à chaleur air-eau',
    'Mars 2026',
    false,
    'draft'::public.testimonial_status
  ),
  (
    'Karim B.',
    'Toulouse (31)',
    'KB',
    5,
    'J''avais peur de la complexité administrative des aides. Effinor a tout géré : MaPrimeRénov'', CEE, dossier ANAH. Au final 14 000 € d''aides sur un projet de 18 000 €.',
    'Rénovation globale',
    'Janvier 2026',
    false,
    'draft'::public.testimonial_status
  ),
  (
    'Marie-Hélène P.',
    'Nantes (44)',
    'MP',
    5,
    'Étude technique sérieuse, devis clair, installation impeccable en 3 jours. Le suivi par l''équipe technique a été parfait. Très bon rapport qualité-prix.',
    'Système solaire combiné',
    'Février 2026',
    false,
    'draft'::public.testimonial_status
  )
) AS v(
  author_name,
  author_city,
  author_initials,
  rating,
  text,
  service_type,
  date_label,
  featured,
  status
)
WHERE NOT EXISTS (SELECT 1 FROM public.testimonials LIMIT 1);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "testimonials_select_public" ON public.testimonials;
CREATE POLICY "testimonials_select_public"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

DROP POLICY IF EXISTS "testimonials_all_staff" ON public.testimonials;
CREATE POLICY "testimonials_all_staff"
  ON public.testimonials FOR ALL
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

GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;

COMMIT;
