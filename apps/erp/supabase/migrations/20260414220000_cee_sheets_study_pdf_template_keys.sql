-- Gabarits PDF étude / accord : backfill à partir de simulator_key quand les clés sont vides.
-- Voir `resolveStudyTemplatesFromCeeSheet` (ERP) : pac_* → pac_v1, destrat_* → destrat_v1.

UPDATE public.cee_sheets
SET presentation_template_key = CASE
  WHEN lower(coalesce(simulator_key, '')) LIKE '%pac%' THEN 'pac_v1'
  WHEN lower(coalesce(simulator_key, '')) LIKE '%destrat%' THEN 'destrat_v1'
  ELSE 'destrat_v1'
END
WHERE deleted_at IS NULL
  AND (presentation_template_key IS NULL OR btrim(presentation_template_key) = '');

UPDATE public.cee_sheets
SET agreement_template_key = CASE
  WHEN lower(coalesce(simulator_key, '')) LIKE '%pac%' THEN 'pac_v1'
  WHEN lower(coalesce(simulator_key, '')) LIKE '%destrat%' THEN 'destrat_v1'
  ELSE 'destrat_v1'
END
WHERE deleted_at IS NULL
  AND (agreement_template_key IS NULL OR btrim(agreement_template_key) = '');
