-- Migration SQL : Ajout des champs de paiement et mode de commande
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter les colonnes si elles n'existent pas déjà
ALTER TABLE public.commandes
  ADD COLUMN IF NOT EXISTS type_commande TEXT DEFAULT 'devis',
  ADD COLUMN IF NOT EXISTS mode_suivi TEXT,
  ADD COLUMN IF NOT EXISTS paiement_statut TEXT DEFAULT 'en_attente',
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- 2. Ajouter les contraintes CHECK (idempotentes)
DO $$
BEGIN
  -- Contrainte type_commande
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'commandes_type_commande_check'
      AND conrelid = 'public.commandes'::regclass
  ) THEN
    ALTER TABLE public.commandes
      ADD CONSTRAINT commandes_type_commande_check
      CHECK (type_commande IN ('devis', 'commande'));
  END IF;

  -- Contrainte mode_suivi
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'commandes_mode_suivi_check'
      AND conrelid = 'public.commandes'::regclass
  ) THEN
    ALTER TABLE public.commandes
      ADD CONSTRAINT commandes_mode_suivi_check
      CHECK (mode_suivi IN ('paiement_en_ligne', 'rappel'));
  END IF;

  -- Contrainte paiement_statut
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'commandes_paiement_statut_check'
      AND conrelid = 'public.commandes'::regclass
  ) THEN
    ALTER TABLE public.commandes
      ADD CONSTRAINT commandes_paiement_statut_check
      CHECK (paiement_statut IN ('en_attente', 'payee', 'echouee', 'annulee'));
  END IF;
END $$;

-- 3. Mettre à jour les anciennes commandes avec des valeurs par défaut
UPDATE public.commandes
  SET type_commande = COALESCE(type_commande, 'devis'),
      mode_suivi = COALESCE(mode_suivi, 'rappel'),
      paiement_statut = COALESCE(paiement_statut, 'en_attente')
  WHERE type_commande IS NULL 
     OR mode_suivi IS NULL 
     OR paiement_statut IS NULL;

-- 4. Commentaires pour documentation
COMMENT ON COLUMN public.commandes.type_commande IS 'Type de commande: devis ou commande';
COMMENT ON COLUMN public.commandes.mode_suivi IS 'Mode de suivi: paiement_en_ligne ou rappel';
COMMENT ON COLUMN public.commandes.paiement_statut IS 'Statut du paiement: en_attente, payee, echouee, annulee';
COMMENT ON COLUMN public.commandes.stripe_session_id IS 'ID de la session Stripe Checkout';
COMMENT ON COLUMN public.commandes.stripe_payment_intent_id IS 'ID du PaymentIntent Stripe (via webhook)';

