-- Migration: Correction des colonnes de prix dans commandes_lignes
-- Date: 2025-11-26
-- Description: 
--   Cette migration vérifie et crée les colonnes nécessaires dans commandes_lignes
--   pour les prix unitaires HT et totaux de ligne HT.
--   Elle assure la compatibilité avec le code front qui utilise prix_unitaire_ht et total_ligne_ht.

-- 1. Ajouter prix_unitaire_ht si elle n'existe pas
ALTER TABLE public.commandes_lignes
  ADD COLUMN IF NOT EXISTS prix_unitaire_ht NUMERIC(10,2);

-- 2. Ajouter total_ligne_ht si elle n'existe pas
ALTER TABLE public.commandes_lignes
  ADD COLUMN IF NOT EXISTS total_ligne_ht NUMERIC(10,2);

-- 3. Vérifier si produit_id existe (le nom exact dans votre schema)
-- Si product_id existe mais pas produit_id, créer produit_id (ou adapter selon votre schema réel)
DO $$
BEGIN
  -- Si product_id existe, on peut le renommer en produit_id (optionnel)
  -- Ou créer produit_id s'il n'existe pas du tout
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'commandes_lignes' 
      AND column_name = 'produit_id'
  ) THEN
    -- Si product_id existe, on le renomme (optionnel, à adapter)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'commandes_lignes' 
        AND column_name = 'product_id'
    ) THEN
      ALTER TABLE public.commandes_lignes RENAME COLUMN product_id TO produit_id;
    ELSE
      -- Sinon créer produit_id (UUID pour référence vers products)
      ALTER TABLE public.commandes_lignes ADD COLUMN produit_id UUID;
    END IF;
  END IF;
END $$;

-- 4. Si les colonnes prix_unitaire et total existent, migrer les données
DO $$
BEGIN
  -- Migrer depuis prix_unitaire vers prix_unitaire_ht si nécessaire
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'commandes_lignes' 
      AND column_name = 'prix_unitaire'
  ) THEN
    UPDATE public.commandes_lignes
    SET prix_unitaire_ht = prix_unitaire
    WHERE prix_unitaire_ht IS NULL AND prix_unitaire IS NOT NULL;
  END IF;

  -- Migrer depuis total vers total_ligne_ht si nécessaire
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'commandes_lignes' 
      AND column_name = 'total'
  ) THEN
    UPDATE public.commandes_lignes
    SET total_ligne_ht = total
    WHERE total_ligne_ht IS NULL AND total IS NOT NULL;
  END IF;

  -- Calculer total_ligne_ht à partir de prix_unitaire_ht * quantite si manquant
  UPDATE public.commandes_lignes
  SET total_ligne_ht = prix_unitaire_ht * quantite
  WHERE total_ligne_ht IS NULL AND prix_unitaire_ht IS NOT NULL AND quantite IS NOT NULL;
END $$;

-- 5. Vérification finale
-- Cette requête devrait retourner les colonnes attendues :
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'commandes_lignes' 
--   AND column_name IN ('prix_unitaire_ht', 'total_ligne_ht', 'meta');

