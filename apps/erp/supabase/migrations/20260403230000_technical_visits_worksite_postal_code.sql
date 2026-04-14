-- Code postal travaux (déduction région, aligné bénéficiaire / lead).
ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS worksite_postal_code text;

COMMENT ON COLUMN public.technical_visits.worksite_postal_code IS 'Code postal du lieu des travaux — utilisé pour calculer la région.';
