-- =============================================================================
-- Jeu de données démo : 40 chaînes complètes
-- Bénéficiaire → Lead → Visite technique → Opération (+ conversion sur le lead)
--
-- Prérequis : au moins un profil actif dans public.profiles (compte interne).
-- Exécution : SQL Editor Supabase ou psql. À lancer une fois sur une base de dev.
-- Pour rejouer : supprimer les lignes créées (références OP-DEMO-2026-*, VT-DEMO-*, e-mails *@seed-effinor.invalid).
--
-- Note : pas de colonne reference_technical_visit_id sur operations (schémas sans la migration
-- 20260331200000_operations_reference_technical_visit.sql). Le lien VT–opération reste via lead_id.
-- Après application de cette migration, vous pouvez exécuter :
--   UPDATE public.operations o
--   SET reference_technical_visit_id = v.id
--   FROM public.technical_visits v
--   WHERE o.lead_id = v.lead_id AND o.operation_reference LIKE 'OP-DEMO-2026-%';
-- =============================================================================

DO $$
DECLARE
  i int;
  v_agent uuid;
  v_confirmer uuid;
  v_tech uuid;
  ben_id uuid;
  lead_id uuid;
  vt_id uuid;
  op_id uuid;
  src public.lead_source;
  vt_st public.technical_visit_status;
  cities text[] := ARRAY['Lyon', 'Paris', 'Marseille', 'Toulouse', 'Nantes', 'Bordeaux', 'Lille', 'Strasbourg'];
  city text;
BEGIN
  SELECT p.id
  INTO v_agent
  FROM public.profiles p
  WHERE p.deleted_at IS NULL
    AND p.is_active = true
  ORDER BY p.email
  LIMIT 1;

  IF v_agent IS NULL THEN
    RAISE EXCEPTION 'Aucun profil actif : créez un utilisateur ou exécutez le seed RBAC avant ce script.';
  END IF;

  SELECT p.id
  INTO v_confirmer
  FROM public.profiles p
  WHERE p.deleted_at IS NULL
    AND p.is_active = true
    AND p.id <> v_agent
  ORDER BY p.email
  LIMIT 1;

  v_confirmer := COALESCE(v_confirmer, v_agent);

  SELECT p.id
  INTO v_tech
  FROM public.profiles p
  WHERE p.deleted_at IS NULL
    AND p.is_active = true
    AND p.id NOT IN (v_agent, v_confirmer)
  ORDER BY p.email
  LIMIT 1;

  v_tech := COALESCE(v_tech, v_agent);

  FOR i IN 1..40 LOOP
    ben_id := gen_random_uuid();
    lead_id := gen_random_uuid();
    vt_id := gen_random_uuid();
    op_id := gen_random_uuid();
    city := cities[1 + ((i - 1) % array_length(cities, 1))];

    CASE (i % 7)
      WHEN 0 THEN src := 'landing_froid'::public.lead_source;
      WHEN 1 THEN src := 'cold_call'::public.lead_source;
      WHEN 2 THEN src := 'phone'::public.lead_source;
      WHEN 3 THEN src := 'partner'::public.lead_source;
      WHEN 4 THEN src := 'referral'::public.lead_source;
      WHEN 5 THEN src := 'website'::public.lead_source;
      ELSE src := 'landing_lum'::public.lead_source;
    END CASE;

    CASE (i % 6)
      WHEN 0 THEN vt_st := 'validated'::public.technical_visit_status;
      WHEN 1 THEN vt_st := 'performed'::public.technical_visit_status;
      WHEN 2 THEN vt_st := 'scheduled'::public.technical_visit_status;
      WHEN 3 THEN vt_st := 'report_pending'::public.technical_visit_status;
      WHEN 4 THEN vt_st := 'to_schedule'::public.technical_visit_status;
      ELSE vt_st := 'performed'::public.technical_visit_status;
    END CASE;

    INSERT INTO public.beneficiaries (
      id,
      company_name,
      siren,
      siret_head_office,
      contact_first_name,
      contact_last_name,
      contact_role,
      phone,
      email,
      head_office_address,
      head_office_postal_code,
      head_office_city,
      worksite_address,
      worksite_postal_code,
      worksite_city,
      climate_zone,
      region,
      status,
      sales_owner_id,
      confirmer_id,
      acquisition_source
    )
    VALUES (
      ben_id,
      'Entreprise démo ' || i || ' SAS',
      lpad(((123456789 + i) % 1000000000)::text, 9, '0'),
      lpad(((12345678901234 + i) % 10000000000000)::text, 14, '0'),
      'Prénom',
      'Contact ' || i,
      'Dirigeant',
      '06' || lpad(((10000000 + i) % 100000000)::text, 8, '0'),
      'beneficiaire.seed' || i || '@seed-effinor.invalid',
      i || ' rue du Siège',
      lpad((69001 + (i % 89))::text, 5, '0'),
      city,
      i || ' zone artisanale du Parc',
      lpad((69002 + (i % 89))::text, 5, '0'),
      city,
      'H' || (1 + (i % 3)),
      'Auvergne-Rhône-Alpes',
      'active',
      v_agent,
      v_confirmer,
      'seed_sql'
    );

    INSERT INTO public.leads (
      id,
      source,
      campaign,
      landing,
      product_interest,
      company_name,
      siren,
      siret,
      first_name,
      last_name,
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
      confirmed_by_user_id,
      ai_lead_score,
      ai_lead_summary
    )
    VALUES (
      lead_id,
      src,
      'Campagne démo ' || i,
      'landing-demo',
      'Éclairage LED / déstratification',
      'Entreprise démo ' || i || ' SAS',
      lpad(((123456789 + i) % 1000000000)::text, 9, '0'),
      lpad(((12345678901234 + i) % 10000000000000)::text, 14, '0'),
      'Prénom',
      'Contact ' || i,
      'Responsable site',
      '06' || lpad(((20000000 + i) % 100000000)::text, 8, '0'),
      'lead.seed' || i || '@seed-effinor.invalid',
      i || ' rue du Siège',
      lpad((69001 + (i % 89))::text, 5, '0'),
      city,
      i || ' zone artisanale du Parc',
      lpad((69002 + (i % 89))::text, 5, '0'),
      city,
      'warehouse',
      (800 + (i * 13))::numeric,
      (4.5 + (i % 5) * 0.1)::numeric,
      true,
      ARRAY['gaz', 'pac']::text[],
      1 + (i % 3),
      'converted'::public.lead_status,
      'qualified'::public.qualification_status,
      v_agent,
      v_agent,
      v_confirmer,
      50 + (i % 50),
      'Résumé IA démo #' || i || ' — pré-qualification stockée par seed SQL.'
    );

    INSERT INTO public.technical_visits (
      id,
      vt_reference,
      lead_id,
      beneficiary_id,
      status,
      scheduled_at,
      performed_at,
      time_slot,
      technician_id,
      worksite_address,
      surface_m2,
      ceiling_height_m,
      heating_type,
      observations,
      technical_report,
      photos
    )
    VALUES (
      vt_id,
      'VT-DEMO-2026-' || lpad(i::text, 3, '0'),
      lead_id,
      ben_id,
      vt_st,
      now() - (i || ' days')::interval - interval '2 hours',
      now() - (i || ' days')::interval,
      'Matin',
      v_tech,
      i || ' zone artisanale du Parc, ' || city,
      (800 + (i * 13))::numeric,
      (4.5 + (i % 5) * 0.1)::numeric,
      ARRAY['fioul', 'electricite']::text[],
      'Observations terrain démo #' || i || ' — accès quai, présence RSSI.',
      'Compte-rendu VT démo #' || i || ' : puissance radiante estimée, conformité CEE.',
      '[]'::jsonb
    );

    INSERT INTO public.operations (
      id,
      operation_reference,
      beneficiary_id,
      lead_id,
      cee_sheet_code,
      product_family,
      title,
      operation_status,
      sales_status,
      admin_status,
      technical_status,
      sales_owner_id,
      confirmer_id,
      technical_owner_id,
      technical_visit_date,
      estimated_quote_amount_ht,
      estimated_prime_amount,
      notes
    )
    VALUES (
      op_id,
      'OP-DEMO-2026-' || lpad(i::text, 3, '0'),
      ben_id,
      lead_id,
      'BAR-TH-104',
      'lighting_led'::public.product_family,
      'Opération démo #' || i || ' — LED entrepôt ' || city,
      'installation_in_progress'::public.operation_status,
      'quote_sent'::public.sales_status,
      'pending'::public.admin_status,
      'study_in_progress'::public.technical_status,
      v_agent,
      v_confirmer,
      v_tech,
      now() - (i || ' days')::interval,
      (45000 + i * 1200)::numeric,
      (12000 + i * 300)::numeric,
      'Dossier généré par seed_demo_full_chain_40.sql'
    );

    UPDATE public.leads
    SET
      converted_beneficiary_id = ben_id,
      converted_operation_id = op_id,
      updated_at = now()
    WHERE id = lead_id;
  END LOOP;
END $$;
