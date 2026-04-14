-- Civilité du contact (M., Mme) — aligné sur les bénéficiaires.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS civility text;

COMMENT ON COLUMN public.leads.civility IS 'Civilité affichage : M., Mme, etc.';
