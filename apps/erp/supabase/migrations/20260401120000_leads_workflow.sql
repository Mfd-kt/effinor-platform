-- =============================================================================
-- Leads — workflow terrain (agent → confirmateur → VT)
-- Renommages + champs siège / chantier / médias / traçabilité
-- =============================================================================

-- Renommages colonnes existantes
ALTER TABLE public.leads RENAME COLUMN contact_first_name TO first_name;
ALTER TABLE public.leads RENAME COLUMN contact_last_name TO last_name;
ALTER TABLE public.leads RENAME COLUMN postal_code TO worksite_postal_code;
ALTER TABLE public.leads RENAME COLUMN city TO worksite_city;
ALTER TABLE public.leads RENAME COLUMN notes TO qualification_notes;
ALTER TABLE public.leads RENAME COLUMN score TO ai_lead_score;

-- Traçabilité
ALTER TABLE public.leads
  ADD COLUMN created_by_agent_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN confirmed_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

-- Adresse siège (obligatoire en application pour préparer la VT — défaut chaîne vide)
ALTER TABLE public.leads
  ADD COLUMN head_office_address text NOT NULL DEFAULT '',
  ADD COLUMN head_office_postal_code text NOT NULL DEFAULT '',
  ADD COLUMN head_office_city text NOT NULL DEFAULT '';

-- Pré-qualification complémentaire
ALTER TABLE public.leads
  ADD COLUMN heated_building boolean,
  ADD COLUMN warehouse_count integer;

-- Médias & IA (stockage uniquement)
ALTER TABLE public.leads
  ADD COLUMN aerial_photo_url text,
  ADD COLUMN cadastral_parcel_image_url text,
  ADD COLUMN recording_url text,
  ADD COLUMN recording_notes text,
  ADD COLUMN ai_lead_summary text;

-- Normaliser les adresses chantier (anciennes lignes NULL → vide)
UPDATE public.leads
SET
  worksite_address = COALESCE(worksite_address, ''),
  worksite_postal_code = COALESCE(worksite_postal_code, ''),
  worksite_city = COALESCE(worksite_city, '');

ALTER TABLE public.leads
  ALTER COLUMN worksite_address SET NOT NULL,
  ALTER COLUMN worksite_address SET DEFAULT '',
  ALTER COLUMN worksite_postal_code SET NOT NULL,
  ALTER COLUMN worksite_city SET NOT NULL;

CREATE INDEX idx_leads_created_by_agent_id ON public.leads (created_by_agent_id);
CREATE INDEX idx_leads_confirmed_by_user_id ON public.leads (confirmed_by_user_id);

COMMENT ON COLUMN public.leads.created_by_agent_id IS 'Profil ayant créé le lead (agent).';
COMMENT ON COLUMN public.leads.confirmed_by_user_id IS 'Confirmateur ayant qualifié le dossier.';
COMMENT ON COLUMN public.leads.qualification_notes IS 'Notes de qualification (confirmateur).';
COMMENT ON COLUMN public.leads.ai_lead_summary IS 'Résumé IA — saisie ou import ultérieur.';
COMMENT ON COLUMN public.leads.ai_lead_score IS 'Score IA — stockage uniquement.';
