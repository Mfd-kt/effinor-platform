-- ============================================
-- Migration: Créer la table blog_categories
-- ============================================
-- Date: 2025-12-04
-- Description: Table pour gérer les catégories du blog
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
END $$;

-- ============================================
-- ÉTAPE 2: Créer la table blog_categories
-- ============================================

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT
);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE public.blog_categories IS 'Table pour gérer les catégories du blog';
COMMENT ON COLUMN public.blog_categories.id IS 'Identifiant unique de la catégorie';
COMMENT ON COLUMN public.blog_categories.slug IS 'Slug URL-friendly unique pour la catégorie';
COMMENT ON COLUMN public.blog_categories.name IS 'Nom de la catégorie';
COMMENT ON COLUMN public.blog_categories.description IS 'Description de la catégorie';

-- ============================================
-- ÉTAPE 3: Ajouter la colonne category_id à la table posts
-- ============================================

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.posts 
    ADD COLUMN category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN public.posts.category_id IS 'Référence vers la catégorie du blog (nullable)';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 4: Activer RLS sur la table blog_categories
-- ============================================

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 5: Supprimer les anciennes policies (si elles existent)
-- ============================================

DROP POLICY IF EXISTS "Public can view blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Admins can manage blog categories" ON public.blog_categories;

-- ============================================
-- ÉTAPE 6: Créer les policies RLS
-- ============================================

-- Policy 1: Lecture publique
CREATE POLICY "Public can view blog categories"
ON public.blog_categories
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy 2: Écriture admin uniquement
CREATE POLICY "Admins can manage blog categories"
ON public.blog_categories
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
-- ÉTAPE 7: Vérifications finales
-- ============================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'blog_categories'
  ) THEN
    RAISE EXCEPTION 'La table blog_categories n''a pas été créée correctement';
  END IF;
END $$;

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès: Table blog_categories créée avec RLS policies';
  RAISE NOTICE '📋 Vérifications:';
  RAISE NOTICE '   - Table blog_categories: ✅';
  RAISE NOTICE '   - Colonne category_id ajoutée à posts: ✅';
  RAISE NOTICE '   - RLS activé: ✅';
  RAISE NOTICE '   - Policies créées: ✅';
END $$;














