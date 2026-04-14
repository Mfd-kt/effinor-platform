-- Fiches déstrat (BAT-TH / IND-BA) : simulator_key souvent NULL après ajout de la colonne.
UPDATE public.cee_sheets
SET
  simulator_key = 'destrat',
  updated_at = now()
WHERE deleted_at IS NULL
  AND (simulator_key IS NULL OR trim(simulator_key) = '')
  AND (
    calculation_profile = 'coeff_zone_system_power'
    OR label ILIKE '%déstratification%'
    OR label ILIKE '%destratification%'
    OR code ILIKE 'BAT-TH%'
    OR code ILIKE 'IND-BA%'
  );
