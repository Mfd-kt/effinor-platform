ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS head_office_siret text,
  ADD COLUMN IF NOT EXISTS worksite_siret text;

UPDATE public.leads
SET head_office_siret = siret
WHERE head_office_siret IS NULL
  AND siret IS NOT NULL;
