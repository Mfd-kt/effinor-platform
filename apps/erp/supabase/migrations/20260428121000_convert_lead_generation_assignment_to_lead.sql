-- =============================================================================
-- Conversion atomique assignment lead generation → public.leads
-- Verrouillage FOR UPDATE sur assignment puis stock ; une transaction ; pas de double lead.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.convert_lead_generation_assignment_to_lead(
  p_assignment_id uuid,
  p_agent_id uuid
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
  v_lead_id uuid;
  v_addr text;
  v_pc text;
  v_city text;
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

  IF v_assignment.created_lead_id IS NOT NULL THEN
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
    RETURN QUERY SELECT 'already_converted'::text, NULL::uuid;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.lead_generation_assignment_id = p_assignment_id
       OR l.lead_generation_stock_id = v_stock.id
  ) THEN
    RETURN QUERY SELECT 'already_converted'::text, NULL::uuid;
    RETURN;
  END IF;

  v_addr := COALESCE(NULLIF(btrim(v_stock.address), ''), '');
  v_pc := COALESCE(NULLIF(btrim(v_stock.postal_code), ''), '');
  v_city := COALESCE(NULLIF(btrim(v_stock.city), ''), '');

  INSERT INTO public.leads (
    source,
    campaign,
    landing,
    product_interest,
    company_name,
    siret,
    head_office_siret,
    worksite_siret,
    first_name,
    last_name,
    civility,
    contact_name,
    job_title,
    department,
    contact_role,
    phone,
    email,
    head_office_address,
    head_office_postal_code,
    head_office_city,
    worksite_address,
    worksite_postal_code,
    worksite_city,
    building_type,
    surface_m2,
    ceiling_height_m,
    heated_building,
    heating_type,
    warehouse_count,
    lead_status,
    qualification_status,
    assigned_to,
    created_by_agent_id,
    owner_user_id,
    lead_channel,
    lead_origin,
    lead_generation_stock_id,
    lead_generation_assignment_id
  ) VALUES (
    'lead_generation'::public.lead_source,
    NULL,
    NULL,
    NULL,
    v_stock.company_name,
    v_stock.siret,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    v_stock.phone,
    v_stock.email,
    v_addr,
    v_pc,
    v_city,
    v_addr,
    v_pc,
    v_city,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'new'::public.lead_status,
    'pending'::public.qualification_status,
    p_agent_id,
    p_agent_id,
    NULL,
    NULL,
    NULL,
    v_stock.id,
    p_assignment_id
  )
  RETURNING id INTO v_lead_id;

  UPDATE public.lead_generation_assignments
  SET
    created_lead_id = v_lead_id,
    outcome = 'converted_to_lead',
    assignment_status = 'consumed',
    consumed_at = now(),
    last_activity_at = now()
  WHERE id = p_assignment_id;

  UPDATE public.lead_generation_stock
  SET
    converted_lead_id = v_lead_id,
    stock_status = 'converted'
  WHERE id = v_stock.id;

  RETURN QUERY SELECT 'success'::text, v_lead_id;
END;
$$;

COMMENT ON FUNCTION public.convert_lead_generation_assignment_to_lead(uuid, uuid) IS
  'Conversion transactionnelle assignment → lead CRM ; verrous assignment + stock.';

GRANT EXECUTE ON FUNCTION public.convert_lead_generation_assignment_to_lead(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_lead_generation_assignment_to_lead(uuid, uuid) TO service_role;
