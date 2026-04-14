-- Région (dérivée du CP travaux / siège, comme les bénéficiaires) — affichage et suivi VT.
ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS region text;

COMMENT ON COLUMN public.technical_visits.region IS 'Région administrative (France), alignée sur la logique bénéficiaire / code postal.';
