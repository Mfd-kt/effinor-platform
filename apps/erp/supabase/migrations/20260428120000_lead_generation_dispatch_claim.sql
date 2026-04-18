-- =============================================================================
-- Dispatch lead generation : claim atomique (FOR UPDATE SKIP LOCKED)
-- Appelée via RPC depuis le service applicatif — une transaction, pas de double attribution.
-- =============================================================================

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
    ORDER BY lgs.target_score DESC, lgs.created_at ASC
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
  'Sélectionne des fiches prêtes (SKIP LOCKED), crée les assignments et rattache le stock — transaction unique.';

GRANT EXECUTE ON FUNCTION public.dispatch_lead_generation_stock_claim(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_lead_generation_stock_claim(uuid, integer, integer) TO service_role;
