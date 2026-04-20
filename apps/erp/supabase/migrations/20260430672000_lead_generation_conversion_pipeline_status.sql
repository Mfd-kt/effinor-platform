-- =============================================================================
-- Pipeline commercial : à la conversion, commercial_pipeline_status = converted.
-- Reprend le corps des fonctions de 20260430560000 (inchangé sinon).
-- =============================================================================
-- Conversion lead-generation → CRM : fusion des champs stock (décideur,
-- email enrichi, téléphone, adresse, notes contexte) dans public.leads.
-- Recalcule aussi finalize_lead_generation_conversion_with_existing_lead.
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
  v_email text;
  v_phone text;
  v_dm text;
  v_role text;
  v_split_fn text;
  v_split_ln text;
  v_space integer;
  v_lg_notes text;
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

  v_email := NULLIF(
    btrim(COALESCE(v_stock.enriched_email, v_stock.email, '')),
    ''
  );
  v_phone := NULLIF(
    btrim(COALESCE(v_stock.phone, v_stock.normalized_phone, '')),
    ''
  );

  v_dm := NULLIF(btrim(COALESCE(v_stock.decision_maker_name, '')), '');
  v_role := NULLIF(btrim(COALESCE(v_stock.decision_maker_role, '')), '');
  v_split_fn := NULL;
  v_split_ln := NULL;
  IF v_dm IS NOT NULL THEN
    v_space := strpos(v_dm, ' ');
    IF v_space > 0 THEN
      v_split_fn := left(v_dm, v_space - 1);
      v_split_ln := NULLIF(btrim(substring(v_dm from v_space + 1)), '');
    END IF;
  END IF;

  v_lg_notes := '';
  IF v_stock.linkedin_url IS NOT NULL AND btrim(v_stock.linkedin_url) <> '' THEN
    v_lg_notes := v_lg_notes || 'LinkedIn : ' || btrim(v_stock.linkedin_url) || E'\n';
  END IF;
  IF COALESCE(v_stock.enriched_website, v_stock.website) IS NOT NULL
     AND btrim(COALESCE(v_stock.enriched_website, v_stock.website, '')) <> '' THEN
    v_lg_notes := v_lg_notes || 'Site : ' || btrim(COALESCE(v_stock.enriched_website, v_stock.website)) || E'\n';
  END IF;
  IF v_stock.siret IS NOT NULL AND btrim(v_stock.siret) <> '' THEN
    v_lg_notes := v_lg_notes || 'SIRET : ' || btrim(v_stock.siret) || E'\n';
  END IF;
  IF v_stock.category IS NOT NULL AND btrim(v_stock.category) <> '' THEN
    v_lg_notes := v_lg_notes || 'Catégorie : ' || btrim(v_stock.category) ||
      CASE
        WHEN v_stock.sub_category IS NOT NULL AND btrim(v_stock.sub_category) <> ''
          THEN ' / ' || btrim(v_stock.sub_category)
        ELSE ''
      END || E'\n';
  END IF;
  IF v_stock.enrichment_source IS NOT NULL THEN
    v_lg_notes := v_lg_notes || 'Enrichissement : ' || v_stock.enrichment_source::text ||
      ' (' || v_stock.enrichment_confidence::text || ')' || E'\n';
  END IF;
  IF v_stock.headcount_range IS NOT NULL AND btrim(v_stock.headcount_range) <> '' THEN
    v_lg_notes := v_lg_notes || 'Effectifs : ' || btrim(v_stock.headcount_range) || E'\n';
  END IF;
  v_lg_notes := NULLIF(btrim(v_lg_notes), '');

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
    recording_notes,
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
    v_split_fn,
    v_split_ln,
    NULL,
    v_dm,
    v_role,
    NULL,
    v_role,
    v_phone,
    v_email,
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
    COALESCE(v_lg_notes, ''),
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
    last_activity_at = now(),
    commercial_pipeline_status = 'converted'
  WHERE id = p_assignment_id;

  UPDATE public.lead_generation_stock
  SET
    converted_lead_id = v_lead_id,
    stock_status = 'converted'
  WHERE id = v_stock.id;

  RETURN QUERY SELECT 'success'::text, v_lead_id;
END;
$$;

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
  v_email_stock text;
  v_phone_stock text;
  v_dm text;
  v_role text;
  v_split_fn text;
  v_split_ln text;
  v_space integer;
  v_lg_notes text;
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

  v_email_stock := NULLIF(
    btrim(COALESCE(v_stock.enriched_email, v_stock.email, '')),
    ''
  );
  v_phone_stock := NULLIF(
    btrim(COALESCE(v_stock.phone, v_stock.normalized_phone, '')),
    ''
  );

  v_dm := NULLIF(btrim(COALESCE(v_stock.decision_maker_name, '')), '');
  v_role := NULLIF(btrim(COALESCE(v_stock.decision_maker_role, '')), '');
  v_split_fn := NULL;
  v_split_ln := NULL;
  IF v_dm IS NOT NULL THEN
    v_space := strpos(v_dm, ' ');
    IF v_space > 0 THEN
      v_split_fn := left(v_dm, v_space - 1);
      v_split_ln := NULLIF(btrim(substring(v_dm from v_space + 1)), '');
    END IF;
  END IF;

  v_lg_notes := '';
  IF v_stock.linkedin_url IS NOT NULL AND btrim(v_stock.linkedin_url) <> '' THEN
    v_lg_notes := v_lg_notes || 'LinkedIn : ' || btrim(v_stock.linkedin_url) || E'\n';
  END IF;
  IF COALESCE(v_stock.enriched_website, v_stock.website) IS NOT NULL
     AND btrim(COALESCE(v_stock.enriched_website, v_stock.website, '')) <> '' THEN
    v_lg_notes := v_lg_notes || 'Site : ' || btrim(COALESCE(v_stock.enriched_website, v_stock.website)) || E'\n';
  END IF;
  IF v_stock.siret IS NOT NULL AND btrim(v_stock.siret) <> '' THEN
    v_lg_notes := v_lg_notes || 'SIRET : ' || btrim(v_stock.siret) || E'\n';
  END IF;
  IF v_stock.category IS NOT NULL AND btrim(v_stock.category) <> '' THEN
    v_lg_notes := v_lg_notes || 'Catégorie : ' || btrim(v_stock.category) ||
      CASE
        WHEN v_stock.sub_category IS NOT NULL AND btrim(v_stock.sub_category) <> ''
          THEN ' / ' || btrim(v_stock.sub_category)
        ELSE ''
      END || E'\n';
  END IF;
  IF v_stock.enrichment_source IS NOT NULL THEN
    v_lg_notes := v_lg_notes || 'Enrichissement : ' || v_stock.enrichment_source::text ||
      ' (' || v_stock.enrichment_confidence::text || ')' || E'\n';
  END IF;
  IF v_stock.headcount_range IS NOT NULL AND btrim(v_stock.headcount_range) <> '' THEN
    v_lg_notes := v_lg_notes || 'Effectifs : ' || btrim(v_stock.headcount_range) || E'\n';
  END IF;
  v_lg_notes := NULLIF(btrim(v_lg_notes), '');

  UPDATE public.leads
  SET
    source = 'lead_generation'::public.lead_source,
    lead_generation_stock_id = v_stock.id,
    lead_generation_assignment_id = p_assignment_id,
    email = COALESCE(NULLIF(btrim(email), ''), v_email_stock),
    phone = COALESCE(NULLIF(btrim(phone), ''), v_phone_stock),
    contact_name = COALESCE(NULLIF(btrim(contact_name), ''), v_dm),
    job_title = COALESCE(NULLIF(btrim(job_title), ''), v_role),
    contact_role = COALESCE(NULLIF(btrim(contact_role), ''), v_role),
    first_name = COALESCE(NULLIF(btrim(first_name), ''), v_split_fn),
    last_name = COALESCE(NULLIF(btrim(last_name), ''), v_split_ln),
    company_name = COALESCE(NULLIF(btrim(company_name), ''), v_stock.company_name),
    siret = COALESCE(NULLIF(btrim(siret), ''), NULLIF(btrim(v_stock.siret), '')),
    head_office_address = COALESCE(NULLIF(btrim(head_office_address), ''), NULLIF(btrim(v_stock.address), '')),
    head_office_postal_code = COALESCE(NULLIF(btrim(head_office_postal_code), ''), NULLIF(btrim(v_stock.postal_code), '')),
    head_office_city = COALESCE(NULLIF(btrim(head_office_city), ''), NULLIF(btrim(v_stock.city), '')),
    worksite_address = COALESCE(NULLIF(btrim(worksite_address), ''), NULLIF(btrim(v_stock.address), '')),
    worksite_postal_code = COALESCE(NULLIF(btrim(worksite_postal_code), ''), NULLIF(btrim(v_stock.postal_code), '')),
    worksite_city = COALESCE(NULLIF(btrim(worksite_city), ''), NULLIF(btrim(v_stock.city), '')),
    recording_notes = CASE
      WHEN v_lg_notes IS NULL THEN recording_notes
      WHEN recording_notes IS NULL OR btrim(recording_notes) = '' THEN v_lg_notes
      WHEN position(E'--- Lead generation ---' in recording_notes) > 0 THEN recording_notes
      ELSE btrim(recording_notes) || E'\n\n--- Lead generation ---' || E'\n' || v_lg_notes
    END
  WHERE id = p_lead_id;

  UPDATE public.lead_generation_assignments
  SET
    created_lead_id = p_lead_id,
    outcome = 'converted_to_lead',
    assignment_status = 'consumed',
    consumed_at = now(),
    last_activity_at = now(),
    commercial_pipeline_status = 'converted'
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
  'Après simulateur agent : rattache un lead existant à une fiche lead-generation, fusionne les données stock et clôture l’assignment.';
