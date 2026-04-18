-- =============================================================================
-- Clôture agent : refus / hors cible depuis le suivi d’appel (transaction).
-- Consomme l’assignation, libère le stock (rejet), libère la capacité agent.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.close_lead_generation_assignment_from_terminal_call(
  p_assignment_id uuid,
  p_agent_id uuid,
  p_outcome text,
  p_last_call_status text,
  p_last_call_at timestamptz,
  p_last_call_note text,
  p_last_call_recording_url text
)
RETURNS TABLE (
  result_code text
)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_assignment public.lead_generation_assignments%ROWTYPE;
  v_stock public.lead_generation_stock%ROWTYPE;
  v_stock_rows integer;
BEGIN
  IF p_outcome IS NULL OR p_outcome NOT IN ('out_of_target', 'cancelled') THEN
    RETURN QUERY SELECT 'invalid_outcome'::text;
    RETURN;
  END IF;

  SELECT *
  INTO v_assignment
  FROM public.lead_generation_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::text;
    RETURN;
  END IF;

  IF v_assignment.agent_id IS DISTINCT FROM p_agent_id THEN
    RETURN QUERY SELECT 'forbidden'::text;
    RETURN;
  END IF;

  IF v_assignment.created_lead_id IS NOT NULL THEN
    RETURN QUERY SELECT 'already_converted'::text;
    RETURN;
  END IF;

  IF v_assignment.outcome IS DISTINCT FROM 'pending' THEN
    RETURN QUERY SELECT 'invalid_assignment_state'::text;
    RETURN;
  END IF;

  IF v_assignment.assignment_status NOT IN ('assigned', 'opened', 'in_progress') THEN
    RETURN QUERY SELECT 'invalid_assignment_state'::text;
    RETURN;
  END IF;

  SELECT *
  INTO v_stock
  FROM public.lead_generation_stock
  WHERE id = v_assignment.stock_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'stock_not_found'::text;
    RETURN;
  END IF;

  IF v_stock.converted_lead_id IS NOT NULL THEN
    RETURN QUERY SELECT 'already_converted'::text;
    RETURN;
  END IF;

  IF v_stock.current_assignment_id IS DISTINCT FROM p_assignment_id THEN
    RETURN QUERY SELECT 'stock_mismatch'::text;
    RETURN;
  END IF;

  UPDATE public.lead_generation_assignments
  SET
    last_call_status = p_last_call_status,
    last_call_at = p_last_call_at,
    last_call_note = p_last_call_note,
    last_call_recording_url = p_last_call_recording_url,
    outcome = p_outcome,
    outcome_reason = p_last_call_status,
    assignment_status = 'consumed',
    consumed_at = now(),
    last_activity_at = COALESCE(p_last_call_at, now()),
    recycle_status = 'closed',
    updated_at = now()
  WHERE id = p_assignment_id;

  UPDATE public.lead_generation_stock
  SET
    stock_status = 'rejected',
    current_assignment_id = NULL,
    rejection_reason = format('agent_terminal_call:%s', p_outcome),
    updated_at = now()
  WHERE id = v_stock.id
    AND current_assignment_id = p_assignment_id;

  GET DIAGNOSTICS v_stock_rows = ROW_COUNT;
  IF v_stock_rows <> 1 THEN
    RAISE EXCEPTION 'lead_generation_terminal_close_stock_rows:%', v_stock_rows;
  END IF;

  RETURN QUERY SELECT 'success'::text;
END;
$$;

COMMENT ON FUNCTION public.close_lead_generation_assignment_from_terminal_call IS
  'Clôture côté commercial (hors cible / refus) : assignment consommée, stock rejeté, file libérée.';

GRANT EXECUTE ON FUNCTION public.close_lead_generation_assignment_from_terminal_call(
  uuid,
  uuid,
  text,
  text,
  timestamptz,
  text,
  text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.close_lead_generation_assignment_from_terminal_call(
  uuid,
  uuid,
  text,
  text,
  timestamptz,
  text,
  text
) TO service_role;
