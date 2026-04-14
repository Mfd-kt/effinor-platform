-- Migration: Ajout du champ avatar_url à la table utilisateurs
-- Date: 2025-12-01
-- Description: Ajoute le champ avatar_url pour stocker l'URL de la photo de profil depuis Supabase Storage

-- Vérifier si la colonne existe déjà avant de l'ajouter
DO $$ 
BEGIN
    -- Ajouter avatar_url si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'utilisateurs' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.utilisateurs 
        ADD COLUMN avatar_url TEXT;
        
        -- Copier les données de photo_profil_url vers avatar_url si photo_profil_url existe
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'utilisateurs' 
            AND column_name = 'photo_profil_url'
        ) THEN
            UPDATE public.utilisateurs 
            SET avatar_url = photo_profil_url 
            WHERE photo_profil_url IS NOT NULL AND avatar_url IS NULL;
        END IF;
        
        RAISE NOTICE 'Colonne avatar_url ajoutée à la table utilisateurs';
    ELSE
        RAISE NOTICE 'Colonne avatar_url existe déjà';
    END IF;
END $$;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_utilisateurs_avatar_url 
ON public.utilisateurs(avatar_url) 
WHERE avatar_url IS NOT NULL;

-- Commentaire sur la colonne
COMMENT ON COLUMN public.utilisateurs.avatar_url IS 'URL de la photo de profil stockée dans Supabase Storage (bucket avatars)';



















