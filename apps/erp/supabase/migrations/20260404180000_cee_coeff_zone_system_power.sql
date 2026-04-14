-- Profil de calcul : coefficient (zone × convectif/radiatif) × P (kW) — déstratification BAT / IND.

ALTER TABLE public.cee_sheets
  DROP CONSTRAINT IF EXISTS cee_sheets_calculation_profile_check;

ALTER TABLE public.cee_sheets
  ADD CONSTRAINT cee_sheets_calculation_profile_check CHECK (
    calculation_profile IN (
      'manual',
      'linear_single',
      'product_two',
      'coeff_zone_system_power'
    )
  );

COMMENT ON COLUMN public.cee_sheets.calculation_profile IS
  'manual | linear_single | product_two | coeff_zone_system_power — voir compute CEE côté app.';
COMMENT ON COLUMN public.cee_sheets.input_fields IS
  'Tableau JSON : champs number ou select (options).';
COMMENT ON COLUMN public.operations.cee_input_values IS
  'Valeurs saisies pour la fiche (nombres, chaînes, ou clé warehouses: tableau de { zone, heating_system, power_kw }).';

-- BAT-TH-142 (v. A71.4) — tertiaire, France métropolitaine
UPDATE public.cee_sheets
SET
  label = 'Système de déstratification d''air (France métropolitaine) — tertiaire BAT-TH-142',
  calculation_profile = 'coeff_zone_system_power',
  calculation_config = jsonb_build_object(
    'coefficients', jsonb_build_object(
      'H1', jsonb_build_object('convectif', 3900, 'radiatif', 1400),
      'H2', jsonb_build_object('convectif', 4500, 'radiatif', 1600),
      'H3', jsonb_build_object('convectif', 4600, 'radiatif', 1600)
    ),
    'supports_multi_local', true
  ),
  input_fields = '[
    {"key":"zone","label":"Zone climatique","type":"select","required":true,"options":[{"value":"H1","label":"H1"},{"value":"H2","label":"H2"},{"value":"H3","label":"H3"}]},
    {"key":"heating_system","label":"Type de chauffage du local","type":"select","required":true,"options":[{"value":"convectif","label":"Système convectif"},{"value":"radiatif","label":"Système radiatif"}]},
    {"key":"power_kw","label":"Puissance nominale P du système de chauffage","type":"number","unit":"kW","required":true,"min":0,"step":0.01}
  ]'::jsonb,
  updated_at = now()
WHERE deleted_at IS NULL
  AND (
    lower(trim(code)) = lower(trim('BAT-TH-142 (v. A71.4)'))
    OR code ILIKE 'BAT-TH-142%'
  );

-- IND-BA-110 (v. A71.4) — industriel
UPDATE public.cee_sheets
SET
  label = 'Système de déstratification d''air — industriel IND-BA-110',
  calculation_profile = 'coeff_zone_system_power',
  calculation_config = jsonb_build_object(
    'coefficients', jsonb_build_object(
      'H1', jsonb_build_object('convectif', 7200, 'radiatif', 2500),
      'H2', jsonb_build_object('convectif', 8000, 'radiatif', 2800),
      'H3', jsonb_build_object('convectif', 8500, 'radiatif', 3000)
    ),
    'supports_multi_local', true
  ),
  input_fields = '[
    {"key":"zone","label":"Zone climatique","type":"select","required":true,"options":[{"value":"H1","label":"H1"},{"value":"H2","label":"H2"},{"value":"H3","label":"H3"}]},
    {"key":"heating_system","label":"Type de chauffage du local","type":"select","required":true,"options":[{"value":"convectif","label":"Système convectif"},{"value":"radiatif","label":"Système radiatif"}]},
    {"key":"power_kw","label":"Puissance nominale P du système de chauffage","type":"number","unit":"kW","required":true,"min":0,"step":0.01}
  ]'::jsonb,
  updated_at = now()
WHERE deleted_at IS NULL
  AND (
    lower(trim(code)) = lower(trim('IND-BA-110 (v. A71.4)'))
    OR code ILIKE 'IND-BA-110%'
  );
