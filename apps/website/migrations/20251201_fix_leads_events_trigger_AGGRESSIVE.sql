-- Migration AGGRESSIVE: Suppression complète de tous les triggers leads_events
-- Date: 2025-12-01
-- Description: Supprime TOUS les triggers et fonctions liés à leads_events
-- pour résoudre définitivement l'erreur de clé étrangère

-- ÉTAPE 1: Supprimer TOUS les triggers possibles sur la table leads
-- Utiliser une boucle pour supprimer TOUS les triggers, même ceux qu'on ne connaît pas
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Supprimer tous les triggers sur la table leads
    FOR r IN 
        SELECT trigger_name 
        FROM information_schema.triggers
        WHERE event_object_table = 'leads'
        AND trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON leads CASCADE';
        RAISE NOTICE 'Trigger supprimé: %', r.trigger_name;
    END LOOP;
END $$;

-- Supprimer aussi manuellement les triggers connus (au cas où)
DROP TRIGGER IF EXISTS trigger_log_lead_creation ON leads CASCADE;
DROP TRIGGER IF EXISTS trigger_create_lead_event ON leads CASCADE;
DROP TRIGGER IF EXISTS trigger_leads_events_insert ON leads CASCADE;
DROP TRIGGER IF EXISTS trigger_sync_lead_status_text ON leads CASCADE;
DROP TRIGGER IF EXISTS trigger_after_lead_insert ON leads CASCADE;
DROP TRIGGER IF EXISTS trigger_before_lead_insert ON leads CASCADE;
DROP TRIGGER IF EXISTS trigger_on_lead_insert ON leads CASCADE;

-- ÉTAPE 2: Supprimer TOUTES les fonctions liées
DROP FUNCTION IF EXISTS log_lead_creation();
DROP FUNCTION IF EXISTS create_lead_event();
DROP FUNCTION IF EXISTS insert_lead_event();
DROP FUNCTION IF EXISTS sync_lead_status_text();

-- ÉTAPE 3: Vérifier et recréer la table leads_events si nécessaire
-- (mais SANS trigger automatique pour l'instant)
DO $$ 
BEGIN
    -- Vérifier si la table existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leads_events'
    ) THEN
        CREATE TABLE leads_events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
            event_type TEXT NOT NULL,
            details JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_leads_events_lead_id ON leads_events(lead_id);
        CREATE INDEX IF NOT EXISTS idx_leads_events_event_type ON leads_events(event_type);
        CREATE INDEX IF NOT EXISTS idx_leads_events_created_at ON leads_events(created_at DESC);
    END IF;
END $$;

-- ÉTAPE 4: IMPORTANT - Ne PAS créer de trigger automatique pour l'instant
-- Les événements seront créés manuellement via l'API si nécessaire
-- Cela évite complètement le problème de clé étrangère lors de l'insertion

-- ÉTAPE 5: Vérifier qu'il n'y a plus de triggers sur leads
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE event_object_table = 'leads'
    AND trigger_schema = 'public';
    
    RAISE NOTICE 'Nombre de triggers restants sur la table leads: %', trigger_count;
    
    IF trigger_count > 0 THEN
        RAISE NOTICE 'Liste des triggers restants:';
        FOR trigger_count IN 
            SELECT trigger_name 
            FROM information_schema.triggers
            WHERE event_object_table = 'leads'
            AND trigger_schema = 'public'
        LOOP
            RAISE NOTICE '  - %', trigger_count;
        END LOOP;
    END IF;
END $$;

-- ÉTAPE 6: Commentaire final
COMMENT ON TABLE leads_events IS 'Table pour logger les événements liés aux leads. Les insertions sont faites manuellement via l''API, pas via trigger automatique pour éviter les erreurs de clé étrangère.';

-- NOTE IMPORTANTE: 
-- Cette migration supprime TOUS les triggers automatiques.
-- Si vous avez besoin de logger la création de leads, faites-le manuellement
-- dans le code après avoir vérifié que le lead a été créé avec succès.

