-- Parcours unifié : suivi des runs pipeline + dispatch limité au lot (import_batch_id).

CREATE TABLE IF NOT EXISTS public.lead_generation_pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_batch_id uuid NOT NULL REFERENCES public.lead_generation_import_batches (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running' CHECK (
    status IN ('running', 'completed', 'stopped', 'failed')
  ),
  current_step smallint NOT NULL DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),
  step_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_lead_generation_pipeline_runs_coordinator
  ON public.lead_generation_pipeline_runs (coordinator_batch_id);

CREATE INDEX IF NOT EXISTS idx_lead_generation_pipeline_runs_status
  ON public.lead_generation_pipeline_runs (status)
  WHERE status = 'running';

DROP TRIGGER IF EXISTS set_lead_generation_pipeline_runs_updated_at ON public.lead_generation_pipeline_runs;

CREATE TRIGGER set_lead_generation_pipeline_runs_updated_at
  BEFORE UPDATE ON public.lead_generation_pipeline_runs
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.lead_generation_pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_generation_pipeline_runs_all_active"
  ON public.lead_generation_pipeline_runs
  FOR ALL
  TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

COMMENT ON TABLE public.lead_generation_pipeline_runs IS
  'Orchestration du parcours unique Générer → Yellow → LinkedIn → Améliorer → Distribuer (lot = coordinateur).';

-- Dispatch : filtre optionnel par lot (NULL = comportement historique global).
DROP FUNCTION IF EXISTS public.dispatch_lead_generation_stock_claim(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.dispatch_lead_generation_stock_claim(
  p_agent_id uuid,
  p_limit integer,
  p_batch_number integer,
  p_import_batch_id uuid DEFAULT NULL
)
RETURNS TABLE (
  stock_id uuid,
  assignment_id uuid
)
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH picked AS (
    SELECT lgs.id
    FROM public.lead_generation_stock lgs
    WHERE lgs.stock_status = 'ready'
      AND lgs.qualification_status = 'qualified'
      AND lgs.phone_status = 'found'
      AND lgs.current_assignment_id IS NULL
      AND lgs.dispatch_queue_status = 'ready_now'
      AND (p_import_batch_id IS NULL OR lgs.import_batch_id = p_import_batch_id)
    ORDER BY lgs.dispatch_queue_rank DESC,
             lgs.commercial_score DESC,
             lgs.created_at DESC
    FOR UPDATE OF lgs SKIP LOCKED
    LIMIT greatest(0, coalesce(p_limit, 0))
  ),
  ins AS (
    INSERT INTO public.lead_generation_assignments (
      stock_id,
      agent_id,
      assignment_status,
      outcome,
      batch_number,
      assigned_at
    )
    SELECT
      picked.id,
      p_agent_id,
      'assigned',
      'pending',
      p_batch_number,
      now()
    FROM picked
    RETURNING id AS assignment_id, stock_id AS stock_id
  )
  UPDATE public.lead_generation_stock lgs
  SET
    stock_status = 'assigned',
    current_assignment_id = ins.assignment_id,
    updated_at = now()
  FROM ins
  WHERE lgs.id = ins.stock_id
  RETURNING lgs.id AS stock_id, ins.assignment_id AS assignment_id;
$$;

COMMENT ON FUNCTION public.dispatch_lead_generation_stock_claim(uuid, integer, integer, uuid) IS
  'Sélection ready_now (SKIP LOCKED) ; p_import_batch_id optionnel pour limiter au lot coordinateur.';

GRANT EXECUTE ON FUNCTION public.dispatch_lead_generation_stock_claim(uuid, integer, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_lead_generation_stock_claim(uuid, integer, integer, uuid) TO service_role;
