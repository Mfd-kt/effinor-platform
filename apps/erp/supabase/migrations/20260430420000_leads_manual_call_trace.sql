-- Suivi d’appel manuel sur les fiches prospects (ex. après un appel passé via Aircall).
-- Pas de webhook ni sync automatique : saisie par l’utilisateur uniquement.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS last_call_status text,
  ADD COLUMN IF NOT EXISTS last_call_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_call_note text,
  ADD COLUMN IF NOT EXISTS last_call_recording_url text;

COMMENT ON COLUMN public.leads.last_call_status IS 'Dernier statut d’appel (saisie manuelle).';
COMMENT ON COLUMN public.leads.last_call_at IS 'Date / heure du dernier appel noté.';
COMMENT ON COLUMN public.leads.last_call_note IS 'Note libre sur l’appel.';
COMMENT ON COLUMN public.leads.last_call_recording_url IS 'Lien vers un enregistrement (ex. URL Aircall), optionnel.';
