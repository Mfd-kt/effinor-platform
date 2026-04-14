-- Fix leads_events table structure
-- Remove user_id column if it exists and recreate the table properly

-- ÉTAPE 1: Supprimer la colonne user_id si elle existe
ALTER TABLE IF EXISTS leads_events 
DROP COLUMN IF EXISTS user_id;

-- ÉTAPE 2: Recréer la table leads_events sans user_id (store user_id in details JSONB instead)
DROP TABLE IF EXISTS leads_events CASCADE;

CREATE TABLE leads_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour leads_events
CREATE INDEX IF NOT EXISTS idx_leads_events_lead_id ON leads_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_events_event_type ON leads_events(event_type);
CREATE INDEX IF NOT EXISTS idx_leads_events_created_at ON leads_events(created_at DESC);

-- Note: user_id sera stocké dans details JSONB comme: details->>'user_id'


























