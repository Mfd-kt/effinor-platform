-- ============================================
-- Migration: Ajouter les colonnes manquantes
-- ============================================
-- Cette migration ajoute les colonnes qui manquent et causent des erreurs 400
-- ============================================

-- ============================================
-- PARTIE 1: Table VISITEURS
-- ============================================

-- Ajouter la colonne last_seen si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'visiteurs' 
    AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE public.visiteurs 
    ADD COLUMN last_seen TIMESTAMPTZ DEFAULT NOW();
    
    -- Mettre à jour les valeurs existantes
    -- Utiliser created_at (la table visiteurs n'a pas updated_at)
    UPDATE public.visiteurs 
    SET last_seen = COALESCE(created_at, NOW())
    WHERE last_seen IS NULL;
    
    -- Créer un index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_visiteurs_last_seen 
    ON public.visiteurs(last_seen);
    
    RAISE NOTICE 'Colonne last_seen ajoutée à visiteurs';
  ELSE
    RAISE NOTICE 'Colonne last_seen existe déjà dans visiteurs';
  END IF;
END $$;

-- ============================================
-- PARTIE 2: Table COMMANDES
-- ============================================

-- Ajouter la colonne commercial_assigne_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'commandes' 
    AND column_name = 'commercial_assigne_id'
  ) THEN
    ALTER TABLE public.commandes 
    ADD COLUMN commercial_assigne_id UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL;
    
    -- Créer un index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_commandes_commercial_assigne_id 
    ON public.commandes(commercial_assigne_id)
    WHERE commercial_assigne_id IS NOT NULL;
    
    -- Commentaire sur la colonne
    COMMENT ON COLUMN public.commandes.commercial_assigne_id IS 'Commercial assigné à cette commande (pour filtrage commercial)';
    
    RAISE NOTICE 'Colonne commercial_assigne_id ajoutée à commandes';
  ELSE
    RAISE NOTICE 'Colonne commercial_assigne_id existe déjà dans commandes';
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Après exécution, vérifiez que :
-- 1. La colonne last_seen existe dans visiteurs
-- 2. La colonne commercial_assigne_id existe dans commandes
-- 3. Les index ont été créés
-- ============================================

