-- =============================================================================
-- cee_simulations — split PAC en pac_air_eau / pac_air_air
-- =============================================================================

BEGIN;

-- Migration des lignes existantes : 'pac' → 'pac_air_eau' (valeur par défaut)
UPDATE public.cee_simulations
SET chauffage = 'pac_air_eau'
WHERE chauffage = 'pac';

-- Élargir le CHECK constraint
ALTER TABLE public.cee_simulations
  DROP CONSTRAINT IF EXISTS cee_simulations_chauffage_check;

ALTER TABLE public.cee_simulations
  ADD CONSTRAINT cee_simulations_chauffage_check
  CHECK (chauffage IS NULL OR chauffage IN (
    'gaz', 'gaz_cond', 'fioul', 'elec', 'bois', 'granules',
    'pac_air_eau', 'pac_air_air'
  ));

COMMIT;
