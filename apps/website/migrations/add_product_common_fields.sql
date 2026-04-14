-- Migration: Add marque, reference, caracteristiques columns to public.products
-- Idempotent: uses IF NOT EXISTS to avoid errors if columns already created

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS marque TEXT,
ADD COLUMN IF NOT EXISTS reference TEXT;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS caracteristiques JSONB;

COMMENT ON COLUMN public.products.marque IS 'Marque commerciale du produit';
COMMENT ON COLUMN public.products.reference IS 'Référence interne/fabricant du produit';
COMMENT ON COLUMN public.products.caracteristiques IS 'Données JSON structurées par catégorie';

