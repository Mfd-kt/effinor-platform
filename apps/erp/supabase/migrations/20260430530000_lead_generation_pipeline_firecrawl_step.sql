-- Étape intermédiaire Firecrawl dans le parcours unifié (maps → firecrawl → improve → dispatch).

ALTER TABLE public.lead_generation_pipeline_runs
  DROP CONSTRAINT IF EXISTS lead_generation_pipeline_runs_current_step_check;

ALTER TABLE public.lead_generation_pipeline_runs
  ADD CONSTRAINT lead_generation_pipeline_runs_current_step_check
    CHECK (current_step IN ('maps', 'firecrawl', 'improve', 'dispatch', 'done'));

COMMENT ON COLUMN public.lead_generation_pipeline_runs.current_step IS 'maps | firecrawl | improve | dispatch | done';
