-- Étape 14 — dispatch : sélection stricte sur la file métier « ready_now » + tri par rang / score / date

CREATE OR REPLACE FUNCTION public.dispatch_lead_generation_stock_claim(
  p_agent_id uuid,
  p_limit integer,
  p_batch_number integer
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

COMMENT ON FUNCTION public.dispatch_lead_generation_stock_claim(uuid, integer, integer) IS
  'Sélectionne des fiches prêtes « ready_now » (SKIP LOCKED), tri rang file / score / date — étape 14.';
