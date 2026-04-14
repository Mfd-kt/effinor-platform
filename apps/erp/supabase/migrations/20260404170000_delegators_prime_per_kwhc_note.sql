ALTER TABLE public.delegators
  ADD COLUMN IF NOT EXISTS prime_per_kwhc_note text;

COMMENT ON COLUMN public.delegators.prime_per_kwhc_note IS
  'Montant de prime CEE au kWhc (texte libre, ex. 0,0073 € par kWhc).';
