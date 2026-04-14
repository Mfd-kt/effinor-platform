-- ============================================
-- Migration: Ajouter champ images à categories
-- ============================================
-- Date: 2025-12-04
-- Description: Ajoute un champ images (JSONB) pour stocker les photos de catégorie
-- ============================================

-- Ajouter la colonne images si elle n'existe pas
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Ajouter la colonne description_longue si elle n'existe pas (pour un descriptif plus détaillé)
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS description_longue TEXT;

-- Commentaires
COMMENT ON COLUMN public.categories.images IS 'Images de la catégorie (JSONB array avec {url, legend, alt_text})';
COMMENT ON COLUMN public.categories.description_longue IS 'Description longue et détaillée de la catégorie pour expliquer pourquoi la choisir';

-- Exemple de structure pour images:
-- [
--   {
--     "url": "path/to/image1.jpg",
--     "legend": "Highbay LED en action dans un entrepôt",
--     "alt_text": "Éclairage Highbay LED industriel"
--   },
--   {
--     "url": "path/to/image2.jpg",
--     "legend": "Installation de Highbay LED",
--     "alt_text": "Installation professionnelle"
--   }
-- ]

-- Vérification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'categories' 
    AND column_name = 'images'
  ) THEN
    RAISE EXCEPTION 'La colonne images n''a pas été créée correctement';
  END IF;
  
  RAISE NOTICE '✅ Migration terminée: Colonnes images et description_longue ajoutées à categories';
END $$;














