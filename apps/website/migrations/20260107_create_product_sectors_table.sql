-- ============================================
-- Migration: Créer table de liaison produits-secteurs
-- Date: 2026-01-07
-- Description: Permet de lier les produits aux secteurs d'activité
-- ============================================

-- Créer la table de liaison produits-secteurs
CREATE TABLE IF NOT EXISTS public.product_sectors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  secteur_slug TEXT NOT NULL,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, secteur_slug)
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_product_sectors_product_id ON public.product_sectors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sectors_secteur_slug ON public.product_sectors(secteur_slug);
CREATE INDEX IF NOT EXISTS idx_product_sectors_ordre ON public.product_sectors(ordre);

-- Activer RLS (Row Level Security)
ALTER TABLE public.product_sectors ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire les liaisons
CREATE POLICY "Public can view product sectors"
ON public.product_sectors
FOR SELECT
TO anon, authenticated
USING (true);

-- Politique : Utilisateurs authentifiés peuvent modifier
-- Note: Si vous avez une table profiles avec des rôles, vous pouvez créer une politique plus restrictive
-- Pour l'instant, on permet à tous les utilisateurs authentifiés de modifier
CREATE POLICY "Authenticated can manage product sectors"
ON public.product_sectors
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ajouter un commentaire pour documenter la table
COMMENT ON TABLE public.product_sectors IS 'Table de liaison entre produits et secteurs d''activité';
COMMENT ON COLUMN public.product_sectors.secteur_slug IS 'Slug du secteur (industrie-logistique, tertiaire-bureaux, etc.)';

-- ============================================
-- Vérification
-- ============================================
SELECT 
  'Table product_sectors créée avec succès' as status,
  COUNT(*) as nombre_liaisons
FROM public.product_sectors;

