-- Migration: rénovation énergétique — catégories + fiches (hub effinor.fr/services)
-- Date: 2026-04-26
-- Description:
--   * re_energie_categories : piliers (Isolation, Chauffage, Rénovation globale)
--   * re_energie_articles   : fiches (TipTap dans l'ERP) ou external_href vers /services/…
-- RLS : lecture publique des catégories ; articles alignés sur blog_articles
-- Pré-requis: public.blog_status, public.current_user_has_role_code

BEGIN;

-- ============================================================
-- TABLE re_energie_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.re_energie_categories (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now(),
  slug       text         NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title      text         NOT NULL,
  sort_order int          NOT NULL DEFAULT 0,
  icon_key   text         NULL
);

COMMENT ON TABLE public.re_energie_categories IS
  'Piliers page Rénovation énergétique (grille type effy).';
COMMENT ON COLUMN public.re_energie_categories.icon_key IS
  'Clé optionnelle pour icône côté site vitrine.';

CREATE INDEX IF NOT EXISTS idx_re_energie_categories_sort
  ON public.re_energie_categories (sort_order, title);

-- ============================================================
-- TABLE re_energie_articles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.re_energie_articles (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now(),
  published_at     timestamptz  NULL,
  category_id      uuid         NOT NULL
    REFERENCES public.re_energie_categories(id) ON DELETE RESTRICT,
  slug             text         NOT NULL,
  title            text         NOT NULL,
  excerpt          text         NOT NULL,
  content_html     text         NOT NULL DEFAULT '',
  content_json     jsonb        NULL,
  status           public.blog_status NOT NULL DEFAULT 'draft',
  sort_order       int          NOT NULL DEFAULT 0,
  icon_key         text         NULL,
  external_href    text         NULL,
  cover_image_url  text         NULL,
  cover_image_alt  text         NULL,
  seo_title        text         NULL,
  seo_description  text         NULL,
  author_id        uuid         NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reading_time_min int          NULL,
  view_count       int          NOT NULL DEFAULT 0,
  CONSTRAINT re_energie_articles_category_slug_uniq
    UNIQUE (category_id, slug),
  CONSTRAINT re_energie_articles_slug_format
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT re_energie_articles_excerpt_length
    CHECK (length(excerpt) BETWEEN 20 AND 500),
  CONSTRAINT re_energie_articles_title_not_empty
    CHECK (length(trim(title)) > 0)
);

COMMENT ON TABLE public.re_energie_articles IS
  'Fiches RE — /services (hub) et /services/re/[cat]/[fiche] si pas d''external_href.';
COMMENT ON COLUMN public.re_energie_articles.external_href IS
  'Si défini, le menu pointe vers ce lien (path relatif /services/… ou absolu) au lieu de /services/re.';

CREATE INDEX IF NOT EXISTS idx_re_energie_articles_category
  ON public.re_energie_articles (category_id);
CREATE INDEX IF NOT EXISTS idx_re_energie_articles_status
  ON public.re_energie_articles (status);
CREATE INDEX IF NOT EXISTS idx_re_energie_articles_published
  ON public.re_energie_articles (published_at DESC)
  WHERE published_at IS NOT NULL;

-- Triggers
CREATE OR REPLACE FUNCTION public.set_re_energie_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_re_energie_categories_updated_at
  ON public.re_energie_categories;
CREATE TRIGGER trg_re_energie_categories_updated_at
  BEFORE UPDATE ON public.re_energie_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_re_energie_updated_at();

DROP TRIGGER IF EXISTS trg_re_energie_articles_updated_at
  ON public.re_energie_articles;
CREATE TRIGGER trg_re_energie_articles_updated_at
  BEFORE UPDATE ON public.re_energie_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_re_energie_updated_at();

CREATE OR REPLACE FUNCTION public.set_re_energie_articles_published_at()
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

DROP TRIGGER IF EXISTS trg_re_energie_articles_published_at
  ON public.re_energie_articles;
CREATE TRIGGER trg_re_energie_articles_published_at
  BEFORE INSERT OR UPDATE ON public.re_energie_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_re_energie_articles_published_at();

-- ============================================================
-- SEED : 3 piliers + entrées (liens vers fiches /services/ existantes)
-- ============================================================
INSERT INTO public.re_energie_categories (slug, title, sort_order, icon_key)
VALUES
  ('isolation', 'Isolation', 10, 'layout-grid'),
  ('chauffage', 'Chauffage', 20, 'flame'),
  ('renovation-globale', 'Rénovation globale', 30, 'house-plus')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  sort_order = EXCLUDED.sort_order,
  icon_key = EXCLUDED.icon_key;

-- Fiches de démonstration : beaucoup pointent vers les pages /services/ déjà publiées
INSERT INTO public.re_energie_articles (
  category_id, slug, title, excerpt, content_html, status, sort_order, icon_key, external_href, published_at
)
SELECT c.id, v.slug, v.title, v.excerpt, v.content_html, 'published'::public.blog_status, v.ord, v.ik, v.href, now()
FROM public.re_energie_categories c
JOIN (VALUES
  -- Isolation (exemple de fiche hébergée en base ; les autres = liens)
  ('isolation', 'combles', 'Combles', 'Isolez vos combles (perdus ou aménagés) pour limiter les déperditions thermiques et bénéficier d’éventuelles aides à la rénovation selon critères en vigueur (MaPrimeRénov, CEE, etc.).', '<p><strong>Contenu</strong> : rédigez ici le détail (ERP). Ce bloc est le rendu public.</p>', 10, 'home', NULL::text),
  ('isolation', 'murs', 'Murs', 'L’isolation des murs par l’intérieur ou l’extérieur améliore l’enveloppe du bâtiment. Une étude technique permet de choisir la solution adaptée au contexte (ITE, ITI, etc.).', '<p>Contenu court — à remplacer depuis l’ERP.</p>', 20, 'building-2', NULL),
  ('isolation', 'fenetres', 'Fenêtres', 'Remplacement des menuiseries pour améliorer l’étanchéité et le confort. Les performances (Uw, acier bois) et la pose sont déterminantes pour le résultat.', '<p>Contenu — à remplacer depuis l’ERP.</p>', 30, 'frame', NULL),
  ('isolation', 'sols', 'Sols', 'L’isolation des planchers sur vide sanitaire, sous-sol ou terre-plein réduit les ponts thermiques. Dimensionnement selon usage et existant.', '<p>Contenu — à remplacer depuis l’ERP.</p>', 40, 'layers', NULL),
  -- Chauffage
  ('chauffage', 'pompe-a-chaleur', 'Pompe à chaleur', 'Pompes à chaleur air-eau ou air-air pour le chauffage et l’eau chaude. Dimensionnement, aides, et pose par des professionnels RGE (informations indicatives, sous réserve d’éligibilité).', '<p>Page complète : voir fiche service.</p>', 10, 'air-vent', '/services/pompe-a-chaleur/maison-individuelle'),
  ('chauffage', 'pompe-a-chaleur-immeuble', 'Pompe à chaleur — immeuble', 'Solutions de chauffage collectif : études, dimensionnement, contraintes d’espace en copropriété (informations non contractuelles, étude requise).', '<p>Page complète : voir fiche service.</p>', 20, 'building-2', '/services/pompe-a-chaleur/immeuble-collectif'),
  ('chauffage', 'systeme-solaire-combine', 'Système solaire combiné', 'Couplage solaire pour production d’eau chaude et apport sur le chauffage selon l’enveloppe. Voir la fiche détaillée pour chiffrage et scénarios.', '<p>Page complète : voir fiche service.</p>', 30, 'sun', '/services/systeme-solaire-combine'),
  -- Rénovation globale
  ('renovation-globale', 'renovation-globale', 'Rénovation globale', 'Bouquet de travaux et accompagnement pour une approche d’enveloppe (BAR-TH-174 et contexte d’éligibilité) — contenu pédagogique sur la fiche service.', '<p>Page complète : voir fiche service.</p>', 10, 'sparkles', '/services/renovation-globale')
) AS v(
  cslug, slug, title, excerpt, content_html, ord, ik, href
) ON c.slug = v.cslug
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content_html = EXCLUDED.content_html,
  sort_order = EXCLUDED.sort_order,
  icon_key = EXCLUDED.icon_key,
  external_href = EXCLUDED.external_href,
  status = 'published',
  published_at = COALESCE(public.re_energie_articles.published_at, now());

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.re_energie_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_energie_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "re_energie_categories_select_public" ON public.re_energie_categories;
CREATE POLICY "re_energie_categories_select_public"
  ON public.re_energie_categories FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "re_energie_categories_all_staff" ON public.re_energie_categories;
CREATE POLICY "re_energie_categories_all_staff"
  ON public.re_energie_categories FOR ALL
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

DROP POLICY IF EXISTS "re_energie_articles_select_public" ON public.re_energie_articles;
CREATE POLICY "re_energie_articles_select_public"
  ON public.re_energie_articles FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

DROP POLICY IF EXISTS "re_energie_articles_all_staff" ON public.re_energie_articles;
CREATE POLICY "re_energie_articles_all_staff"
  ON public.re_energie_articles FOR ALL
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
GRANT SELECT ON public.re_energie_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.re_energie_categories TO authenticated;
GRANT SELECT ON public.re_energie_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.re_energie_articles TO authenticated;

COMMIT;
