-- State machine explicite pour lead_generation_pipeline_runs (parcours unifié).

DROP INDEX IF EXISTS public.idx_lead_generation_pipeline_runs_status;

ALTER TABLE public.lead_generation_pipeline_runs
  DROP CONSTRAINT IF EXISTS lead_generation_pipeline_runs_status_check,
  DROP CONSTRAINT IF EXISTS lead_generation_pipeline_runs_current_step_check;

ALTER TABLE public.lead_generation_pipeline_runs
  RENAME COLUMN status TO pipeline_status;

ALTER TABLE public.lead_generation_pipeline_runs
  ALTER COLUMN current_step DROP DEFAULT;

ALTER TABLE public.lead_generation_pipeline_runs
  ALTER COLUMN current_step TYPE text USING (
    CASE current_step::integer
      WHEN 1 THEN 'maps'
      WHEN 2 THEN 'yellow_pages'
      WHEN 3 THEN 'linkedin'
      WHEN 4 THEN 'improve'
      WHEN 5 THEN 'dispatch'
      ELSE 'maps'
    END
  );

ALTER TABLE public.lead_generation_pipeline_runs
  ALTER COLUMN current_step SET DEFAULT 'maps';

ALTER TABLE public.lead_generation_pipeline_runs
  ADD CONSTRAINT lead_generation_pipeline_runs_pipeline_status_check
    CHECK (
      pipeline_status IN ('running', 'completed', 'failed', 'blocked', 'stopped')
    );

ALTER TABLE public.lead_generation_pipeline_runs
  ADD CONSTRAINT lead_generation_pipeline_runs_current_step_check
    CHECK (
      current_step IN ('maps', 'yellow_pages', 'linkedin', 'improve', 'dispatch', 'done')
    );

ALTER TABLE public.lead_generation_pipeline_runs
  ADD COLUMN IF NOT EXISTS steps_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS summary_json jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_lead_generation_pipeline_runs_pipeline_status
  ON public.lead_generation_pipeline_runs (pipeline_status)
  WHERE pipeline_status = 'running';

COMMENT ON COLUMN public.lead_generation_pipeline_runs.pipeline_status IS
  'running | completed | failed | blocked | stopped';
COMMENT ON COLUMN public.lead_generation_pipeline_runs.current_step IS
  'maps | yellow_pages | linkedin | improve | dispatch | done';
COMMENT ON COLUMN public.lead_generation_pipeline_runs.steps_json IS
  'État détaillé par étape (status, count, message, horodatages).';
COMMENT ON COLUMN public.lead_generation_pipeline_runs.warnings IS
  'Avertissements cumulés (tableau de chaînes).';
COMMENT ON COLUMN public.lead_generation_pipeline_runs.summary_json IS
  'Résumé final ou agrégats métier (counts, coordinator, etc.).';
