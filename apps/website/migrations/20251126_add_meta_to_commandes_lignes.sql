-- Migration: Ajout de la colonne meta à public.commandes_lignes
-- Date: 2025-11-26
-- Description: 
--   Cette migration ajoute une colonne JSONB 'meta' à la table commandes_lignes
--   pour stocker des métadonnées supplémentaires sur chaque ligne de commande
--   (nom produit, référence, marque, usage, etc.).
--   Un index GIN est créé pour permettre des requêtes efficaces sur ce champ JSONB.

-- 1. Ajouter la colonne meta si elle n'existe pas
ALTER TABLE public.commandes_lignes
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

-- 2. Forcer un JSON par défaut sur les anciennes lignes
UPDATE public.commandes_lignes
  SET meta = '{}'::jsonb
  WHERE meta IS NULL;

-- 3. Optionnel : petit index GIN si on requête plus tard sur meta
CREATE INDEX IF NOT EXISTS commandes_lignes_meta_gin_idx
  ON public.commandes_lignes
  USING gin (meta);







