-- ============================================
-- Migration: Créer la table pages_seo pour la gestion SEO
-- ============================================
-- Date: 2025-12-04
-- Description: Table pour gérer les meta tags SEO de toutes les pages du site
-- ============================================

-- ============================================
-- ÉTAPE 1: Vérifier que les fonctions helper existent
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin_user' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'La fonction is_admin_user() n''existe pas. Exécutez d''abord migrations/20251202_fix_utilisateurs_rls_recursion.sql';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'has_role' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'La fonction has_role() n''existe pas. Exécutez d''abord migrations/20251202_fix_utilisateurs_rls_recursion.sql';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2: Créer la table pages_seo
-- ============================================

CREATE TABLE IF NOT EXISTS public.pages_seo (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ,
  slug TEXT NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  h1 TEXT,
  intro TEXT,
  og_image_url TEXT,
  is_indexable BOOLEAN DEFAULT true NOT NULL
);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE public.pages_seo IS 'Table pour gérer les meta tags SEO de toutes les pages du site';
COMMENT ON COLUMN public.pages_seo.id IS 'Identifiant unique de la page';
COMMENT ON COLUMN public.pages_seo.slug IS 'Slug de la page (ex: "/", "/a-propos", "/solutions/industrie")';
COMMENT ON COLUMN public.pages_seo.meta_title IS 'Titre SEO (balise <title>)';
COMMENT ON COLUMN public.pages_seo.meta_description IS 'Description SEO (balise <meta name="description">)';
COMMENT ON COLUMN public.pages_seo.h1 IS 'Titre H1 de la page';
COMMENT ON COLUMN public.pages_seo.intro IS 'Chapeau / introduction SEO';
COMMENT ON COLUMN public.pages_seo.og_image_url IS 'URL de l''image Open Graph';
COMMENT ON COLUMN public.pages_seo.is_indexable IS 'Indique si la page doit être indexée par les moteurs de recherche';

-- ============================================
-- ÉTAPE 3: Créer les index
-- ============================================

-- Index unique sur slug (déjà géré par UNIQUE constraint)
-- Index sur is_indexable pour filtrer rapidement les pages indexables
CREATE INDEX IF NOT EXISTS idx_pages_seo_is_indexable ON public.pages_seo(is_indexable);

-- ============================================
-- ÉTAPE 4: Créer le trigger pour updated_at
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_pages_seo_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_pages_seo_updated_at() IS 'Met à jour automatiquement updated_at lors de la modification d''une page SEO';

-- Trigger pour appeler la fonction à chaque UPDATE
DROP TRIGGER IF EXISTS trigger_update_pages_seo_updated_at ON public.pages_seo;
CREATE TRIGGER trigger_update_pages_seo_updated_at
  BEFORE UPDATE ON public.pages_seo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pages_seo_updated_at();

-- ============================================
-- ÉTAPE 5: Activer RLS sur la table pages_seo
-- ============================================

ALTER TABLE public.pages_seo ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 6: Supprimer les anciennes policies (si elles existent)
-- ============================================

DROP POLICY IF EXISTS "Public can view indexable pages" ON public.pages_seo;
DROP POLICY IF EXISTS "Admins can manage pages_seo" ON public.pages_seo;

-- ============================================
-- ÉTAPE 7: Créer les policies RLS
-- ============================================

-- Policy 1: Lecture publique pour les pages indexables
CREATE POLICY "Public can view indexable pages"
ON public.pages_seo
FOR SELECT
TO anon, authenticated
USING (is_indexable = true);

-- Policy 2: Écriture admin uniquement
CREATE POLICY "Admins can manage pages_seo"
ON public.pages_seo
FOR ALL
TO authenticated
USING (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
)
WITH CHECK (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
);

-- ============================================
-- ÉTAPE 8: Vérifications finales
-- ============================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'pages_seo'
  ) THEN
    RAISE EXCEPTION 'La table pages_seo n''a pas été créée correctement';
  END IF;
END $$;

-- Vérifier que RLS est activé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'pages_seo'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS n''est pas activé sur la table pages_seo';
  END IF;
END $$;

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès: Table pages_seo créée avec RLS policies';
  RAISE NOTICE '📋 Vérifications:';
  RAISE NOTICE '   - Table pages_seo: ✅';
  RAISE NOTICE '   - Index créés: ✅';
  RAISE NOTICE '   - Trigger updated_at: ✅';
  RAISE NOTICE '   - RLS activé: ✅';
  RAISE NOTICE '   - Policies créées: ✅';
END $$;

