-- Migration: table blog_articles + bucket marketing-media + RLS
-- Date: 2026-04-25
-- Description: backend du module Blog Effinor.
--   * Table blog_articles : contenu rédactionnel publié sur effinor.fr/blog
--   * Bucket marketing-media : images d'articles (et de réalisations à venir)
--   * RLS : lecture publique des articles published, CRUD réservé staff marketing
-- Pré-requis:
--   * fonction current_user_has_role_code (cf. 20260411130000_cee_sheet_workflows.sql)
--   * rôle marketing_manager (cf. 20260425190000_add_marketing_manager_role.sql)

BEGIN;

-- ============================================================
-- ENUM blog_status
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'blog_status'
  ) THEN
    CREATE TYPE public.blog_status AS ENUM (
      'draft',
      'published',
      'archived'
    );
  END IF;
END$$;

COMMENT ON TYPE public.blog_status IS
  'Statut article blog : draft = brouillon, published = publié, archived = archivé';

-- ============================================================
-- TABLE blog_articles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_articles (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL    DEFAULT now(),
  updated_at       timestamptz NOT NULL    DEFAULT now(),
  published_at     timestamptz NULL,

  -- Contenu
  slug             text        UNIQUE NOT NULL,
  title            text        NOT NULL,
  excerpt          text        NOT NULL,
  content_html     text        NOT NULL DEFAULT '',
  content_json     jsonb       NULL,

  -- Médias
  cover_image_url  text        NULL,
  cover_image_alt  text        NULL,

  -- SEO
  seo_title        text        NULL,
  seo_description  text        NULL,

  -- Catégorisation
  category         text        NULL,
  tags             text[]      NOT NULL DEFAULT '{}',

  -- Auteur
  author_id        uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Stats
  reading_time_min int         NULL,
  view_count       int         NOT NULL DEFAULT 0,

  -- État
  status           public.blog_status NOT NULL DEFAULT 'draft',
  featured         boolean     NOT NULL DEFAULT false,

  -- Contraintes
  CONSTRAINT blog_articles_slug_format
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT blog_articles_excerpt_length
    CHECK (length(excerpt) BETWEEN 20 AND 280),
  CONSTRAINT blog_articles_title_not_empty
    CHECK (length(trim(title)) > 0)
);

COMMENT ON TABLE public.blog_articles IS
  'Articles de blog Effinor. Publiés sur effinor.fr/blog quand status=published.';
COMMENT ON COLUMN public.blog_articles.content_html IS
  'HTML rendu par TipTap pour affichage public.';
COMMENT ON COLUMN public.blog_articles.content_json IS
  'Document TipTap JSON pour ré-édition fidèle dans l''ERP.';
COMMENT ON COLUMN public.blog_articles.featured IS
  'true = épinglé en tête de liste.';
COMMENT ON COLUMN public.blog_articles.reading_time_min IS
  'Temps de lecture estimé en minutes (calculé côté Server Action depuis content_html).';

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_blog_articles_published
  ON public.blog_articles (published_at DESC)
  WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_articles_status
  ON public.blog_articles (status);

CREATE INDEX IF NOT EXISTS idx_blog_articles_category
  ON public.blog_articles (category)
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_articles_tags
  ON public.blog_articles USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_blog_articles_featured
  ON public.blog_articles (featured)
  WHERE featured = true;

-- ============================================================
-- TRIGGER : auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_blog_articles_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_articles_updated_at
  ON public.blog_articles;
CREATE TRIGGER trg_blog_articles_updated_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_blog_articles_updated_at();

-- ============================================================
-- TRIGGER : auto-set / clear published_at suivant status
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_blog_articles_published_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Passage à published : set published_at si pas déjà set
  IF NEW.status = 'published'
     AND OLD.status IS DISTINCT FROM 'published'
     AND NEW.published_at IS NULL
  THEN
    NEW.published_at := now();
  END IF;
  -- Sortie de published : on garde published_at pour historique seulement
  -- si l'admin le veut explicitement (cas de re-publication ultérieure).
  -- Pour reset propre on clear ici :
  IF NEW.status <> 'published' AND OLD.status = 'published' THEN
    NEW.published_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_articles_published_at
  ON public.blog_articles;
CREATE TRIGGER trg_blog_articles_published_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_blog_articles_published_at();

-- ============================================================
-- BUCKET marketing-media
-- ============================================================
-- Note: pattern aligné sur les autres migrations storage du projet
-- (cf. 20260403150000_storage_bucket_avatars.sql) : on ne set pas
-- allowed_mime_types pour éviter une dépendance à une version récente
-- de la table storage.buckets. Le filtrage MIME est fait côté upload.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('marketing-media', 'marketing-media', true, 52428800)
ON CONFLICT (id) DO UPDATE
SET
  public          = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- ============================================================
-- RLS : blog_articles
-- ============================================================
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

-- Lecture publique : uniquement articles publiés ET dont la date est passée
DROP POLICY IF EXISTS "blog_articles_select_public" ON public.blog_articles;
CREATE POLICY "blog_articles_select_public"
  ON public.blog_articles FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

-- CRUD complet pour staff marketing (toutes opérations confondues)
DROP POLICY IF EXISTS "blog_articles_all_staff" ON public.blog_articles;
CREATE POLICY "blog_articles_all_staff"
  ON public.blog_articles FOR ALL
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
-- RLS : storage.objects (bucket marketing-media)
-- ============================================================
DROP POLICY IF EXISTS "marketing_media_select_public" ON storage.objects;
CREATE POLICY "marketing_media_select_public"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'marketing-media');

DROP POLICY IF EXISTS "marketing_media_insert_staff" ON storage.objects;
CREATE POLICY "marketing_media_insert_staff"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'marketing-media'
    AND (
      public.current_user_has_role_code('super_admin')
      OR public.current_user_has_role_code('admin')
      OR public.current_user_has_role_code('marketing_manager')
    )
  );

DROP POLICY IF EXISTS "marketing_media_update_staff" ON storage.objects;
CREATE POLICY "marketing_media_update_staff"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'marketing-media'
    AND (
      public.current_user_has_role_code('super_admin')
      OR public.current_user_has_role_code('admin')
      OR public.current_user_has_role_code('marketing_manager')
    )
  )
  WITH CHECK (
    bucket_id = 'marketing-media'
    AND (
      public.current_user_has_role_code('super_admin')
      OR public.current_user_has_role_code('admin')
      OR public.current_user_has_role_code('marketing_manager')
    )
  );

DROP POLICY IF EXISTS "marketing_media_delete_staff" ON storage.objects;
CREATE POLICY "marketing_media_delete_staff"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'marketing-media'
    AND (
      public.current_user_has_role_code('super_admin')
      OR public.current_user_has_role_code('admin')
      OR public.current_user_has_role_code('marketing_manager')
    )
  );

-- ============================================================
-- GRANTS (cohérence avec policies)
-- ============================================================
GRANT SELECT ON public.blog_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_articles TO authenticated;

COMMIT;
