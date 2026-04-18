-- =============================================================================
-- Finaliser une conversion lead-generation lorsqu’un lead CRM existe déjà
-- (ex. créé via le simulateur agent). Met à jour le lead, consomme l’assignment
-- et marque le stock comme converti — même invariants que convert_lead_generation_assignment_to_lead.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.finalize_lead_generation_conversion_with_existing_lead(
  p_assignment_id uuid,
  p_agent_id uuid,
  p_lead_id uuid
)
RETURNS TABLE (
  result_code text,
  lead_id uuid
)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_assignment public.lead_generation_assignments%ROWTYPE;
  v_stock public.lead_generation_stock%ROWTYPE;
  v_lead public.leads%ROWTYPE;
BEGIN
  SELECT *
  INTO v_assignment
  FROM public.lead_generation_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::text, NULL::uuid;
    RETURN;
  END IF;

  IF v_assignment.agent_id IS DISTINCT FROM p_agent_id THEN
    RETURN QUERY SELECT 'forbidden'::text, NULL::uuid;
    RETURN;
  END IF;

  IF v_assignment.created_lead_id IS NOT NULL AND v_assignment.created_lead_id IS DISTINCT FROM p_lead_id THEN
    RETURN QUERY SELECT 'already_converted'::text, NULL::uuid;
    RETURN;
  END IF;

  IF v_assignment.outcome IS DISTINCT FROM 'pending' THEN
    RETURN QUERY SELECT 'already_converted'::text, NULL::uuid;
    RETURN;
  END IF;

  IF v_assignment.assignment_status NOT IN ('assigned', 'opened', 'in_progress') THEN
    RETURN QUERY SELECT 'invalid_assignment_state'::text, NULL::uuid;
    RETURN;
  END IF;

  SELECT *
  INTO v_stock
  FROM public.lead_generation_stock
  WHERE id = v_assignment.stock_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid_assignment_state'::text, NULL::uuid;
    RETURN;
  END IF;

  IF v_stock.converted_lead_id IS NOT NULL OR v_stock.stock_status = 'converted' THEN
    IF v_stock.converted_lead_id = p_lead_id THEN
      RETURN QUERY SELECT 'success'::text, p_lead_id;
      RETURN;
    END IF;
    RETURN QUERY SELECT 'already_converted'::text, NULL::uuid;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id IS DISTINCT FROM p_lead_id
      AND (
        l.lead_generation_assignment_id = p_assignment_id
        OR l.lead_generation_stock_id = v_stock.id
      )
  ) THEN
    RETURN QUERY SELECT 'already_converted'::text, NULL::uuid;
    RETURN;
  END IF;

  SELECT *
  INTO v_lead
  FROM public.leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::text, NULL::uuid;
    RETURN;
  END IF;

  IF v_lead.assigned_to IS DISTINCT FROM p_agent_id AND v_lead.created_by_agent_id IS DISTINCT FROM p_agent_id THEN
    RETURN QUERY SELECT 'forbidden'::text, NULL::uuid;
    RETURN;
  END IF;

  IF v_lead.lead_generation_stock_id IS NOT NULL AND v_lead.lead_generation_stock_id IS DISTINCT FROM v_stock.id THEN
    RETURN QUERY SELECT 'forbidden'::text, NULL::uuid;
    RETURN;
  END IF;

  UPDATE public.leads
  SET
    source = 'lead_generation'::public.lead_source,
    lead_generation_stock_id = v_stock.id,
    lead_generation_assignment_id = p_assignment_id
  WHERE id = p_lead_id;

  UPDATE public.lead_generation_assignments
  SET
    created_lead_id = p_lead_id,
    outcome = 'converted_to_lead',
    assignment_status = 'consumed',
    consumed_at = now(),
    last_activity_at = now()
  WHERE id = p_assignment_id;

  UPDATE public.lead_generation_stock
  SET
    converted_lead_id = p_lead_id,
    stock_status = 'converted'
  WHERE id = v_stock.id;

  RETURN QUERY SELECT 'success'::text, p_lead_id;
END;
$$;

COMMENT ON FUNCTION public.finalize_lead_generation_conversion_with_existing_lead(uuid, uuid, uuid) IS
  'Après simulateur agent : rattache un lead existant à une fiche lead-generation et clôture l’assignment.';

GRANT EXECUTE ON FUNCTION public.finalize_lead_generation_conversion_with_existing_lead(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_lead_generation_conversion_with_existing_lead(uuid, uuid, uuid) TO service_role;
