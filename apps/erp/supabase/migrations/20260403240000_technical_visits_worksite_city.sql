-- Ville travaux (aligné fiche lead : adresse / CP / ville séparés).
ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS worksite_city text;

COMMENT ON COLUMN public.technical_visits.worksite_city IS 'Ville du lieu des travaux (reprise lead).';
