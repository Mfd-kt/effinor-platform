-- =============================================================================
-- cee_simulations — flag « cible idéale » (analytics commercial)
-- =============================================================================

ALTER TABLE public.cee_simulations
  ADD COLUMN IF NOT EXISTS cible_ideale boolean NOT NULL DEFAULT false;

-- Index partiel : ne stocke que les vraies cibles → table lookup ultra-rapide
-- pour un futur dashboard « top prospects ».
CREATE INDEX IF NOT EXISTS idx_cee_simulations_cible_ideale
  ON public.cee_simulations (cible_ideale)
  WHERE cible_ideale = true;

COMMENT ON COLUMN public.cee_simulations.cible_ideale IS
  'Indicateur commercial — config logement + revenus optimisant le RAC. Voir isCibleIdeale().';
