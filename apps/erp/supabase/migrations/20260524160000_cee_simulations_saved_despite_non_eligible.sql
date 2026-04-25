-- =============================================================================
-- cee_simulations — flag « enregistré malgré non-éligibilité »
-- (override agent : permet de garder en base un prospect non éligible
--  pour suivi commercial / prospection).
-- =============================================================================

ALTER TABLE public.cee_simulations
  ADD COLUMN IF NOT EXISTS saved_despite_non_eligible boolean NOT NULL DEFAULT false;

-- Index partiel : ne stocke que les overrides → utilisable pour filtre dashboard.
CREATE INDEX IF NOT EXISTS idx_cee_simulations_saved_despite_non_eligible
  ON public.cee_simulations (saved_despite_non_eligible)
  WHERE saved_despite_non_eligible = true;

COMMENT ON COLUMN public.cee_simulations.saved_despite_non_eligible IS
  'true quand l’agent a choisi « Enregistrer quand même » sur un prospect non éligible.';
