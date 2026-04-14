-- ============================================
-- Migration: Ajouter le champ seo_og_image_url à la table posts
-- ============================================
-- Date: 2025-12-04
-- Description: Ajouter le champ seo_og_image_url si il n'existe pas déjà
-- ============================================

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'seo_og_image_url'
  ) THEN
    ALTER TABLE public.posts 
    ADD COLUMN seo_og_image_url TEXT;
    
    COMMENT ON COLUMN public.posts.seo_og_image_url IS 'URL de l''image Open Graph pour le SEO (optionnel)';
    
    RAISE NOTICE '✅ Colonne seo_og_image_url ajoutée à la table posts';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne seo_og_image_url existe déjà dans la table posts';
  END IF;
END $$;

-- Vérifier que seo_title et seo_description existent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'seo_title'
  ) THEN
    ALTER TABLE public.posts 
    ADD COLUMN seo_title TEXT;
    
    COMMENT ON COLUMN public.posts.seo_title IS 'Titre SEO personnalisé (optionnel)';
    
    RAISE NOTICE '✅ Colonne seo_title ajoutée à la table posts';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'seo_description'
  ) THEN
    ALTER TABLE public.posts 
    ADD COLUMN seo_description TEXT;
    
    COMMENT ON COLUMN public.posts.seo_description IS 'Description SEO (optionnel)';
    
    RAISE NOTICE '✅ Colonne seo_description ajoutée à la table posts';
  END IF;
END $$;

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès: Champs SEO ajoutés à la table posts';
END $$;

