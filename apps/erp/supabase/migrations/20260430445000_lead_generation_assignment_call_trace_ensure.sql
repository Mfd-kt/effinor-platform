-- Colonnes suivi d’appel sur lead_generation_assignments : garantir l’existence
-- (si 20260430430000 n’a pas été appliquée sur l’instance) et rafraîchir PostgREST.

ALTER TABLE public.lead_generation_assignments
  ADD COLUMN IF NOT EXISTS last_call_status text;

ALTER TABLE public.lead_generation_assignments
  ADD COLUMN IF NOT EXISTS last_call_at timestamptz;

ALTER TABLE public.lead_generation_assignments
  ADD COLUMN IF NOT EXISTS last_call_note text;

ALTER TABLE public.lead_generation_assignments
  ADD COLUMN IF NOT EXISTS last_call_recording_url text;

COMMENT ON COLUMN public.lead_generation_assignments.last_call_status IS 'Dernier statut d’appel (saisie manuelle).';
COMMENT ON COLUMN public.lead_generation_assignments.last_call_at IS 'Date / heure du dernier appel noté.';
COMMENT ON COLUMN public.lead_generation_assignments.last_call_note IS 'Note libre sur l’appel.';
COMMENT ON COLUMN public.lead_generation_assignments.last_call_recording_url IS 'Lien vers un enregistrement (ex. URL Aircall), optionnel.';

NOTIFY pgrst, 'reload schema';
