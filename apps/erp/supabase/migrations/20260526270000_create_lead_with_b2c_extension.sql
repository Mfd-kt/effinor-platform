-- =============================================================================
-- Phase 2.3.C.4.a — RPC transactionnelle : INSERT leads (B2C) + leads_b2c
-- Appel prévu Phase 2.3.C.3.c.2 depuis les routes API publiques (service_role).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_lead_with_b2c_extension(p_lead_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
  v_first_name text;
  v_last_name text;
  v_company text;
  v_email text;
  v_phone text;
  v_source public.lead_source;
  v_display_name text;
  v_contact_name text;
  v_campaign text;
  v_landing text;
  v_product_interest text;
  v_building_type text;
  v_surface_m2 numeric(14, 2);
  v_ceiling_height_m numeric(10, 2);
  v_heating_type text[];
  v_worksite_address text;
  v_worksite_postal_code text;
  v_worksite_city text;
  v_head_office_address text;
  v_head_office_postal_code text;
  v_head_office_city text;
  v_sim_payload jsonb;
  v_sim_version text;
  v_simulated_at timestamptz;
  v_civility text;
  v_lat numeric;
  v_lng numeric;
  person_label text;
BEGIN
  IF p_lead_payload IS NULL THEN
    RAISE EXCEPTION 'p_lead_payload is required';
  END IF;

  v_company := trim(p_lead_payload->>'company_name');
  IF v_company IS NULL OR length(v_company) = 0 THEN
    RAISE EXCEPTION 'company_name is required and cannot be empty';
  END IF;

  IF p_lead_payload->>'source' IS NULL OR length(trim(p_lead_payload->>'source')) = 0 THEN
    RAISE EXCEPTION 'source is required';
  END IF;

  v_source := trim(p_lead_payload->>'source')::public.lead_source;

  v_first_name := nullif(trim(p_lead_payload->>'first_name'), '');
  v_last_name := nullif(trim(p_lead_payload->>'last_name'), '');
  v_email := nullif(trim(p_lead_payload->>'email'), '');
  v_phone := nullif(trim(p_lead_payload->>'phone'), '');

  person_label := trim(concat_ws(' ', v_first_name, v_last_name));

  -- Aligné sur features/leads/lib/map-to-db.ts computeDisplayName (fallback « Lead anonyme », pas le trigger I.0).
  IF length(person_label) > 0 THEN
    v_display_name := person_label;
  ELSIF length(v_company) > 0 THEN
    v_display_name := v_company;
  ELSE
    v_display_name := 'Lead anonyme';
  END IF;

  v_contact_name := nullif(trim(p_lead_payload->>'contact_name'), '');
  v_campaign := nullif(trim(p_lead_payload->>'campaign'), '');
  v_landing := nullif(trim(p_lead_payload->>'landing'), '');
  v_product_interest := nullif(trim(p_lead_payload->>'product_interest'), '');
  v_building_type := nullif(trim(p_lead_payload->>'building_type'), '');
  v_civility := nullif(trim(p_lead_payload->>'civility'), '');
  v_sim_version := nullif(trim(p_lead_payload->>'sim_version'), '');

  IF p_lead_payload ? 'surface_m2' AND p_lead_payload->>'surface_m2' IS NOT NULL AND trim(p_lead_payload->>'surface_m2') <> '' THEN
    v_surface_m2 := (p_lead_payload->>'surface_m2')::numeric(14, 2);
  ELSE
    v_surface_m2 := NULL;
  END IF;

  IF p_lead_payload ? 'ceiling_height_m'
     AND p_lead_payload->>'ceiling_height_m' IS NOT NULL
     AND trim(p_lead_payload->>'ceiling_height_m') <> '' THEN
    v_ceiling_height_m := (p_lead_payload->>'ceiling_height_m')::numeric(10, 2);
  ELSE
    v_ceiling_height_m := NULL;
  END IF;

  v_heating_type := NULL;
  IF p_lead_payload ? 'heating_type' THEN
    IF jsonb_typeof(p_lead_payload->'heating_type') = 'array' THEN
      SELECT array_agg(elem)
      INTO v_heating_type
      FROM jsonb_array_elements_text(p_lead_payload->'heating_type') AS elem;
    ELSIF jsonb_typeof(p_lead_payload->'heating_type') = 'string'
      AND length(trim(p_lead_payload->>'heating_type')) > 0 THEN
      v_heating_type := ARRAY[trim(p_lead_payload->>'heating_type')];
    END IF;
  END IF;

  v_worksite_address := coalesce(nullif(trim(p_lead_payload->>'worksite_address'), ''), '');
  v_worksite_postal_code := coalesce(nullif(trim(p_lead_payload->>'worksite_postal_code'), ''), '');
  v_worksite_city := coalesce(nullif(trim(p_lead_payload->>'worksite_city'), ''), '');

  v_head_office_address := coalesce(
    nullif(trim(p_lead_payload->>'head_office_address'), ''),
    v_worksite_address
  );
  v_head_office_postal_code := coalesce(
    nullif(trim(p_lead_payload->>'head_office_postal_code'), ''),
    v_worksite_postal_code
  );
  v_head_office_city := coalesce(
    nullif(trim(p_lead_payload->>'head_office_city'), ''),
    v_worksite_city
  );

  v_sim_payload := p_lead_payload->'sim_payload_json';

  v_simulated_at := NULL;
  IF p_lead_payload ? 'simulated_at'
     AND p_lead_payload->>'simulated_at' IS NOT NULL
     AND trim(p_lead_payload->>'simulated_at') <> '' THEN
    v_simulated_at := (p_lead_payload->>'simulated_at')::timestamptz;
  END IF;

  v_lat := NULL;
  v_lng := NULL;
  IF p_lead_payload ? 'latitude'
     AND p_lead_payload->>'latitude' IS NOT NULL
     AND trim(p_lead_payload->>'latitude') <> '' THEN
    v_lat := (p_lead_payload->>'latitude')::numeric;
  END IF;
  IF p_lead_payload ? 'longitude'
     AND p_lead_payload->>'longitude' IS NOT NULL
     AND trim(p_lead_payload->>'longitude') <> '' THEN
    v_lng := (p_lead_payload->>'longitude')::numeric;
  END IF;

  INSERT INTO public.leads (
    source,
    campaign,
    landing,
    product_interest,
    company_name,
    first_name,
    last_name,
    civility,
    contact_name,
    email,
    phone,
    head_office_address,
    head_office_postal_code,
    head_office_city,
    worksite_address,
    worksite_postal_code,
    worksite_city,
    latitude,
    longitude,
    building_type,
    surface_m2,
    ceiling_height_m,
    heating_type,
    lead_status,
    qualification_status,
    lead_type,
    display_name,
    sim_payload_json,
    sim_version,
    simulated_at
  )
  VALUES (
    v_source,
    v_campaign,
    v_landing,
    v_product_interest,
    v_company,
    v_first_name,
    v_last_name,
    v_civility,
    v_contact_name,
    v_email,
    v_phone,
    v_head_office_address,
    v_head_office_postal_code,
    v_head_office_city,
    v_worksite_address,
    v_worksite_postal_code,
    v_worksite_city,
    v_lat,
    v_lng,
    v_building_type,
    v_surface_m2,
    v_ceiling_height_m,
    v_heating_type,
    'new'::public.lead_status,
    'pending'::public.qualification_status,
    'b2c'::public.lead_type,
    v_display_name,
    v_sim_payload,
    v_sim_version,
    v_simulated_at
  )
  RETURNING id INTO v_lead_id;

  INSERT INTO public.leads_b2c (lead_id)
  VALUES (v_lead_id);

  RETURN v_lead_id;
END;
$$;

COMMENT ON FUNCTION public.create_lead_with_b2c_extension(jsonb) IS
  'Phase 2.3.C.4.a — Création atomique d''un lead B2C (public.leads + public.leads_b2c) dans une transaction Postgres. '
  'Destinée aux routes API publiques (apps/website, landing-pac, landing-reno-global) via client admin (service_role). '
  'Les clés JSON inconnues sont ignorées ; champs requis : company_name, source (enum lead_source).';

GRANT EXECUTE ON FUNCTION public.create_lead_with_b2c_extension(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_lead_with_b2c_extension(jsonb) TO service_role;
