-- Suivi d’appel manuel (Aircall / tel) sur l’assignation courante — pas de webhook ni sync API.

ALTER TABLE public.lead_generation_assignments
  ADD COLUMN IF NOT EXISTS last_call_status text,
  ADD COLUMN IF NOT EXISTS last_call_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_call_note text,
  ADD COLUMN IF NOT EXISTS last_call_recording_url text;

COMMENT ON COLUMN public.lead_generation_assignments.last_call_status IS 'Dernier statut d’appel (saisie manuelle).';
COMMENT ON COLUMN public.lead_generation_assignments.last_call_at IS 'Date / heure du dernier appel noté.';
COMMENT ON COLUMN public.lead_generation_assignments.last_call_note IS 'Note libre sur l’appel.';
COMMENT ON COLUMN public.lead_generation_assignments.last_call_recording_url IS 'Lien vers un enregistrement (ex. URL Aircall), optionnel.';
