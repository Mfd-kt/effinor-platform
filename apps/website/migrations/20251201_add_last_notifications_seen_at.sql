-- Migration: Ajout du champ last_notifications_seen_at à la table utilisateurs
-- Date: 2025-12-01
-- Description: Ajoute le champ pour suivre la dernière fois qu'un utilisateur a vu ses notifications

-- Vérifier si la colonne existe déjà avant de l'ajouter
DO $$ 
BEGIN
    -- Ajouter last_notifications_seen_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'utilisateurs' 
        AND column_name = 'last_notifications_seen_at'
    ) THEN
        ALTER TABLE public.utilisateurs 
        ADD COLUMN last_notifications_seen_at TIMESTAMPTZ NULL;
        
        -- Fixer la valeur à NOW() pour tous les utilisateurs existants
        -- Cela évite de montrer toutes les anciennes notifications comme "nouvelles"
        UPDATE public.utilisateurs 
        SET last_notifications_seen_at = NOW() 
        WHERE last_notifications_seen_at IS NULL;
        
        RAISE NOTICE 'Colonne last_notifications_seen_at ajoutée à la table utilisateurs';
    ELSE
        RAISE NOTICE 'Colonne last_notifications_seen_at existe déjà';
    END IF;
END $$;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_utilisateurs_last_notifications_seen_at 
ON public.utilisateurs(last_notifications_seen_at) 
WHERE last_notifications_seen_at IS NOT NULL;

-- Commentaire sur la colonne
COMMENT ON COLUMN public.utilisateurs.last_notifications_seen_at IS 'Timestamp de la dernière fois que l''utilisateur a vu ses notifications (pour filtrer les nouvelles notifications)';

