-- Retrait des imports Pages Jaunes (Apify) et alignement du parcours unifié (maps → improve → dispatch).

-- Lots Apify « Pages Jaunes » : suppression (les fiches liées voient import_batch_id mis à NULL).
DELETE FROM public.lead_generation_import_batches
WHERE source = 'apify_yellow_pages';

-- Lots coordinateur multi-source encore « running » : clôture propre (l’app ne synchronise plus ce type de lot).
UPDATE public.lead_generation_import_batches
SET
  status = 'failed',
  finished_at = COALESCE(finished_at, now()),
  error_summary = LEFT(
    COALESCE(error_summary, '') ||
    CASE
      WHEN COALESCE(error_summary, '') <> '' THEN E'\n'
      ELSE ''
    END ||
    'Import multi-source obsolète — créez un nouvel import Google Maps.',
    2000
  )
WHERE source = 'apify_multi_source'
  AND status = 'running';

-- Parcours unifié : étapes autorisées sans yellow_pages / linkedin.
ALTER TABLE public.lead_generation_pipeline_runs
  DROP CONSTRAINT IF EXISTS lead_generation_pipeline_runs_current_step_check;

UPDATE public.lead_generation_pipeline_runs
SET current_step = 'improve'
WHERE current_step IN ('yellow_pages', 'linkedin');

ALTER TABLE public.lead_generation_pipeline_runs
  ADD CONSTRAINT lead_generation_pipeline_runs_current_step_check
    CHECK (current_step IN ('maps', 'improve', 'dispatch', 'done'));

COMMENT ON COLUMN public.lead_generation_pipeline_runs.current_step IS 'maps | improve | dispatch | done';
