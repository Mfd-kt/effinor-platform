-- Migration: Correction du trigger leads_events pour éviter l'erreur de clé étrangère
-- Date: 2025-12-01
-- Description: Supprime les triggers problématiques et crée un trigger AFTER INSERT
-- pour insérer dans leads_events seulement APRÈS que le lead soit créé

-- ÉTAPE 1: Supprimer tous les triggers existants qui pourraient causer le problème
DROP TRIGGER IF EXISTS trigger_log_lead_creation ON leads;
DROP TRIGGER IF EXISTS trigger_create_lead_event ON leads;
DROP TRIGGER IF EXISTS trigger_leads_events_insert ON leads;

-- ÉTAPE 2: Supprimer les fonctions associées si elles existent
DROP FUNCTION IF EXISTS log_lead_creation();
DROP FUNCTION IF EXISTS create_lead_event();
DROP FUNCTION IF EXISTS insert_lead_event();

-- ÉTAPE 3: Créer une fonction pour logger la création d'un lead (optionnel, non bloquant)
-- Cette fonction sera appelée APRÈS l'insertion pour éviter les problèmes de clé étrangère
CREATE OR REPLACE FUNCTION log_lead_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer un événement dans leads_events APRÈS que le lead soit créé
  -- Utiliser NEW.id qui existe maintenant car le trigger est AFTER INSERT
  INSERT INTO leads_events (lead_id, event_type, details, created_at)
  VALUES (
    NEW.id,
    'lead_created',
    jsonb_build_object(
      'source', COALESCE(NEW.source, 'unknown'),
      'statut', COALESCE(NEW.statut, 'nouveau'),
      'formulaire_complet', COALESCE(NEW.formulaire_complet, false)
    ),
    NOW()
  )
  ON CONFLICT DO NOTHING; -- Ignorer les conflits si l'événement existe déjà
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 4: Créer le trigger AFTER INSERT (pas BEFORE)
-- IMPORTANT: AFTER INSERT garantit que NEW.id existe dans la table leads
CREATE TRIGGER trigger_log_lead_creation
AFTER INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION log_lead_creation();

-- ÉTAPE 5: Vérifier que la table leads_events existe et a la bonne structure
-- Si elle n'existe pas, la créer
CREATE TABLE IF NOT EXISTS leads_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÉTAPE 6: Créer les index si nécessaire
CREATE INDEX IF NOT EXISTS idx_leads_events_lead_id ON leads_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_events_event_type ON leads_events(event_type);
CREATE INDEX IF NOT EXISTS idx_leads_events_created_at ON leads_events(created_at DESC);

-- ÉTAPE 7: Commentaire pour documentation
COMMENT ON FUNCTION log_lead_creation() IS 'Fonction trigger pour logger la création d''un lead dans leads_events. Exécutée APRÈS l''insertion pour éviter les erreurs de clé étrangère.';
COMMENT ON TRIGGER trigger_log_lead_creation ON leads IS 'Trigger AFTER INSERT pour logger automatiquement la création d''un lead dans leads_events.';

-- NOTE: Si vous ne voulez PAS logger automatiquement la création des leads,
-- vous pouvez commenter ou supprimer le trigger ci-dessus.
-- Les événements peuvent être créés manuellement via l'API si nécessaire.

