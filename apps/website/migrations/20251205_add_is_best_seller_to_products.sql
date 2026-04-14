-- ============================================
-- Migration: Ajouter le flag is_best_seller aux produits
-- Date: 2025-12-05
-- Description:
--   Permet de marquer certains produits comme \"best-sellers\"
--   pour les afficher sur la page d'accueil.
-- ============================================

-- 1. Ajouter la colonne si elle n'existe pas encore
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.products.is_best_seller IS
  'Indique si le produit est un best-seller (affiché sur la home).';

-- 2. Index pour les requêtes de best-sellers
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller
  ON public.products(is_best_seller)
  WHERE is_best_seller = TRUE;

-- Fin de migration















