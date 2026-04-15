-- =============================================================================
-- Fiche CEE → template de visite technique (clé + version explicites)
--
-- Note : requires_technical_visit existe déjà (20260411130000_cee_sheet_workflows.sql).
-- Cette migration ajoute uniquement la paire template + contrainte + backfill déstrat.
-- =============================================================================

ALTER TABLE public.cee_sheets
  ADD COLUMN IF NOT EXISTS technical_visit_template_key text,
  ADD COLUMN IF NOT EXISTS technical_visit_template_version integer;

COMMENT ON COLUMN public.cee_sheets.requires_technical_visit IS
  'Indique si le métier attend une visite technique terrain ; le formulaire dynamique est porté par technical_visit_template_key / technical_visit_template_version lorsqu’ils sont renseignés.';

COMMENT ON COLUMN public.cee_sheets.technical_visit_template_key IS
  'Clé du template VT dynamique (registry applicatif), ex. BAT-TH-142. NULL tant qu’aucun gabarit n’est associé à la fiche.';

COMMENT ON COLUMN public.cee_sheets.technical_visit_template_version IS
  'Version entière du template VT (alignée sur le registry). Doit être NULL si technical_visit_template_key est NULL, et non NULL si la clé est renseignée.';

ALTER TABLE public.cee_sheets
  DROP CONSTRAINT IF EXISTS cee_sheets_technical_visit_template_pair_chk;

ALTER TABLE public.cee_sheets
  ADD CONSTRAINT cee_sheets_technical_visit_template_pair_chk CHECK (
    (technical_visit_template_key IS NULL AND technical_visit_template_version IS NULL)
    OR (
      technical_visit_template_key IS NOT NULL
      AND length(trim(technical_visit_template_key)) > 0
      AND technical_visit_template_version IS NOT NULL
    )
  );

-- ---------------------------------------------------------------------------
-- Backfill minimal : fiches déstratification (variantes code / libellé / simulateur).
-- Pas de mise à jour agressive des fiches PAC ou autres.
-- ---------------------------------------------------------------------------
UPDATE public.cee_sheets
SET
  requires_technical_visit = true,
  technical_visit_template_key = 'BAT-TH-142',
  technical_visit_template_version = 1,
  updated_at = now()
WHERE deleted_at IS NULL
  AND technical_visit_template_key IS NULL
  AND technical_visit_template_version IS NULL
  AND COALESCE(lower(trim(simulator_key)), '') NOT IN ('pac', 'pac_air_eau', 'pac_air_air')
  AND (
    lower(trim(coalesce(simulator_key, ''))) = 'destrat'
    OR trim(code) ~* '^BAT-TH'
    OR upper(trim(code)) = 'DESTRAT'
    OR replace(replace(replace(upper(trim(code)), E'\u2019', ''''), '''', ''''), '`', '''') = 'DESTRATIFICATEUR D''AIR'
    OR label ~* 'destratificateur'
    OR label ILIKE '%déstratification%'
    OR label ILIKE '%destratification%'
  );
