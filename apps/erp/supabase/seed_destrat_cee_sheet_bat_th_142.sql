-- =============================================================================
-- Fiche CEE déstratification tertiaire BAT-TH-142 — insertion rapide (dev / préprod)
--
-- Contenu aligné sur la migration `20260404180000_cee_coeff_zone_system_power.sql`
-- + simulateur `destrat`, templates étude/accord, visite technique BAT-TH-142 v1 (registry code).
--
-- Idempotent : ne fait rien si une fiche active avec le même code existe déjà.
-- Exécution : SQL Editor Supabase ou `psql -f ...`
--
-- Après insertion : configurer `workflow_key` (ex. destrat_v1) et l’équipe CEE
-- dans Réglages → Fiches CEE si votre instance attend ces clés.
-- =============================================================================

INSERT INTO public.cee_sheets (
  code,
  label,
  category,
  description,
  sort_order,
  calculation_profile,
  input_fields,
  calculation_config,
  official_pdf_path,
  official_pdf_file_name,
  control_points,
  simulator_key,
  presentation_template_key,
  agreement_template_key,
  requires_technical_visit,
  technical_visit_template_key,
  technical_visit_template_version,
  requires_quote,
  workflow_key,
  is_commercial_active,
  internal_notes
)
SELECT
  'BAT-TH-142',
  'Système de déstratification d''air (France métropolitaine) — tertiaire BAT-TH-142',
  'destratification',
  'Fiche CEE tertiaire — déstratification d''air (BAT-TH-142). Seed rapide.',
  10,
  'coeff_zone_system_power',
  '[
    {"key":"zone","label":"Zone climatique","type":"select","required":true,"options":[{"value":"H1","label":"H1"},{"value":"H2","label":"H2"},{"value":"H3","label":"H3"}]},
    {"key":"heating_system","label":"Type de chauffage du local","type":"select","required":true,"options":[{"value":"convectif","label":"Système convectif"},{"value":"radiatif","label":"Système radiatif"}]},
    {"key":"power_kw","label":"Puissance nominale P du système de chauffage","type":"number","unit":"kW","required":true,"min":0,"step":0.01}
  ]'::jsonb,
  jsonb_build_object(
    'coefficients', jsonb_build_object(
      'H1', jsonb_build_object('convectif', 3900, 'radiatif', 1400),
      'H2', jsonb_build_object('convectif', 4500, 'radiatif', 1600),
      'H3', jsonb_build_object('convectif', 4600, 'radiatif', 1600)
    ),
    'supports_multi_local', true
  ),
  NULL,
  NULL,
  NULL,
  'destrat',
  'destrat_v1',
  'destrat_v1',
  true,
  'BAT-TH-142',
  1,
  true,
  NULL,
  true,
  NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM public.cee_sheets s
  WHERE s.deleted_at IS NULL
    AND lower(trim(s.code)) = lower(trim('BAT-TH-142'))
);
