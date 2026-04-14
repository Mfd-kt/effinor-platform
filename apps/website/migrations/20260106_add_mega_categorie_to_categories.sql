-- ============================================
-- Migration: Ajouter la colonne mega_categorie à la table categories
-- ============================================
-- Date: 2026-01-06
-- Description: Ajoute une colonne pour lier les catégories aux grandes catégories
-- ============================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'categories'
  ) THEN
    RAISE EXCEPTION 'La table categories n''existe pas. Exécutez d''abord la création de la table.';
  END IF;
END $$;

-- Ajouter la colonne mega_categorie
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS mega_categorie TEXT;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_categories_mega_categorie ON public.categories(mega_categorie);

-- Mettre à jour les catégories existantes avec leurs grandes catégories
-- Basé sur les slugs existants
UPDATE public.categories 
SET mega_categorie = 'luminaire'
WHERE slug IN (
  'highbay-led',
  'projecteur-led-floodlight',
  'reglettes-led',
  'panneaux-led',
  'spots-led',
  'eclairage-exterieur-ip65',
  'eclairage-industriel',
  'accessoires-pilotage'
);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.categories.mega_categorie IS 'Grande catégorie parente: chauffer, refroidir, luminaire, ventilation';

-- ============================================
-- Vérification
-- ============================================
SELECT 
  mega_categorie,
  COUNT(*) as nombre_categories
FROM public.categories
GROUP BY mega_categorie
ORDER BY mega_categorie;

