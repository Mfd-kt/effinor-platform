-- Cockpit manager lead_generation : agrégations Postgres (RPC) + indexation ciblée.
-- Définitions alignées sur agent-dispatch-policy.ts (seuils 80 / 12) et les filtres « actifs » du module.

-- -----------------------------------------------------------------------------
-- Index (requêtes cockpit : filtres outcome + statuts + pipeline + SLA + activités)
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_lga_cockpit_pending_pipeline
  ON public.lead_generation_assignments (outcome, assignment_status, commercial_pipeline_status)
  WHERE outcome = 'pending'
    AND assignment_status IN ('assigned', 'opened', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_lga_cockpit_agent_pending
  ON public.lead_generation_assignments (agent_id, outcome, assignment_status, commercial_pipeline_status)
  WHERE outcome = 'pending'
    AND assignment_status IN ('assigned', 'opened', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_lga_cockpit_sla
  ON public.lead_generation_assignments (outcome, assignment_status, sla_status)
  WHERE outcome = 'pending'
    AND assignment_status IN ('assigned', 'opened', 'in_progress')
    AND sla_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lga_assigned_at_pending_new
  ON public.lead_generation_assignments (assigned_at)
  WHERE outcome = 'pending'
    AND assignment_status IN ('assigned', 'opened', 'in_progress')
    AND commercial_pipeline_status = 'new';

CREATE INDEX IF NOT EXISTS idx_lga_last_activity_contacted
  ON public.lead_generation_assignments (last_activity_at)
  WHERE outcome = 'pending'
    AND assignment_status IN ('assigned', 'opened', 'in_progress')
    AND commercial_pipeline_status = 'contacted';

CREATE INDEX IF NOT EXISTS idx_lg_events_type_occurred
  ON public.lead_generation_assignment_events (event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_lg_events_agent_type_occurred
  ON public.lead_generation_assignment_events (agent_id, event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_lg_activities_assignment_next
  ON public.lead_generation_assignment_activities (assignment_id)
  WHERE next_action_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lg_activities_agent_call
  ON public.lead_generation_assignment_activities (agent_id, activity_type);

-- -----------------------------------------------------------------------------
-- Helpers internes
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lead_generation_sales_agent_ids ()
RETURNS TABLE (user_id uuid)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT ur.user_id
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE r.code = 'sales_agent'
    AND p.is_active = true
    AND p.deleted_at IS NULL;
$$;

COMMENT ON FUNCTION public.lead_generation_sales_agent_ids IS
  'Agents commerciaux sélectionnables (même périmètre que get_lead_generation_assignable_agents).';

-- -----------------------------------------------------------------------------
-- 1) Résumé cockpit
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lead_generation_cockpit_summary (
  p_agent_id uuid,
  p_window_end timestamptz,
  p_period_start timestamptz,
  p_prev_period_start timestamptz
)
RETURNS TABLE (
  stock_neuf_total bigint,
  suivi_total bigint,
  sla_warning_total bigint,
  sla_breached_total bigint,
  agents_suspendus_total bigint,
  conversions_24h bigint,
  conversions_7d bigint,
  conversions_period bigint,
  conversions_previous_period bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      p_window_end - interval '24 hours' AS start_24h,
      p_window_end - interval '7 days' AS start_7d
  ),
  base AS (
    SELECT a.*
    FROM public.lead_generation_assignments a
    WHERE a.outcome = 'pending'
      AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
      AND (p_agent_id IS NULL OR a.agent_id = p_agent_id)
  ),
  suspended AS (
    SELECT COUNT(*)::bigint AS c
    FROM (
      SELECT b.agent_id
      FROM public.lead_generation_assignments b
      WHERE b.outcome = 'pending'
        AND b.assignment_status IN ('assigned', 'opened', 'in_progress')
        AND b.agent_id IN (SELECT user_id FROM public.lead_generation_sales_agent_ids())
      GROUP BY b.agent_id
      HAVING
        COUNT(*) FILTER (
          WHERE b.commercial_pipeline_status IN ('contacted', 'follow_up')
        ) >= 80
        OR COUNT(*) FILTER (WHERE b.sla_status = 'breached') >= 12
    ) t
  ),
  suspended_one AS (
    SELECT
      CASE
        WHEN p_agent_id IS NULL THEN 0::bigint
        WHEN (
          SELECT COUNT(*) FILTER (WHERE b.commercial_pipeline_status IN ('contacted', 'follow_up'))
          FROM public.lead_generation_assignments b
          WHERE b.agent_id = p_agent_id
            AND b.outcome = 'pending'
            AND b.assignment_status IN ('assigned', 'opened', 'in_progress')
        ) >= 80 THEN 1::bigint
        WHEN (
          SELECT COUNT(*) FILTER (WHERE b.sla_status = 'breached')
          FROM public.lead_generation_assignments b
          WHERE b.agent_id = p_agent_id
            AND b.outcome = 'pending'
            AND b.assignment_status IN ('assigned', 'opened', 'in_progress')
        ) >= 12 THEN 1::bigint
        ELSE 0::bigint
      END AS c
  ),
  ev AS (
    SELECT e.*
    FROM public.lead_generation_assignment_events e
    WHERE e.event_type = 'moved_to_converted'
      AND (p_agent_id IS NULL OR e.agent_id = p_agent_id)
  )
  SELECT
    (SELECT COUNT(*)::bigint FROM base WHERE commercial_pipeline_status = 'new') AS stock_neuf_total,
    (SELECT COUNT(*)::bigint FROM base WHERE commercial_pipeline_status IN ('contacted', 'follow_up')) AS suivi_total,
    (SELECT COUNT(*)::bigint FROM base WHERE sla_status = 'warning') AS sla_warning_total,
    (SELECT COUNT(*)::bigint FROM base WHERE sla_status = 'breached') AS sla_breached_total,
    CASE
      WHEN p_agent_id IS NULL THEN (SELECT c FROM suspended)
      ELSE (SELECT c FROM suspended_one)
    END AS agents_suspendus_total,
    (SELECT COUNT(*)::bigint FROM ev, bounds WHERE ev.occurred_at >= bounds.start_24h AND ev.occurred_at < p_window_end) AS conversions_24h,
    (SELECT COUNT(*)::bigint FROM ev, bounds WHERE ev.occurred_at >= bounds.start_7d AND ev.occurred_at < p_window_end) AS conversions_7d,
    (SELECT COUNT(*)::bigint FROM ev WHERE ev.occurred_at >= p_period_start AND ev.occurred_at < p_window_end) AS conversions_period,
    (SELECT COUNT(*)::bigint FROM ev WHERE ev.occurred_at >= p_prev_period_start AND ev.occurred_at < p_period_start) AS conversions_previous_period;
$$;

COMMENT ON FUNCTION public.lead_generation_cockpit_summary IS
  'Agrégats portefeuille + conversions ; agents suspendus = politique backlog>=80 ou breached>=12 (agents sales uniquement).';

-- -----------------------------------------------------------------------------
-- 2) Vieillissement portefeuille
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lead_generation_cockpit_portfolio_aging (
  p_agent_id uuid,
  p_now timestamptz
)
RETURNS TABLE (
  new_lt_2h bigint,
  new_gt_2h bigint,
  contacted_lt_24h bigint,
  contacted_gt_24h bigint,
  follow_up_due_today bigint,
  follow_up_overdue bigint
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_2h timestamptz := p_now - interval '2 hours';
  v_24h timestamptz := p_now - interval '24 hours';
  v_paris_date date := (p_now AT TIME ZONE 'Europe/Paris')::date;
  v_day_start timestamptz := (v_paris_date::text || ' 00:00:00')::timestamp AT TIME ZONE 'Europe/Paris';
  v_day_end_excl timestamptz := v_day_start + interval '1 day';
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT a.*
    FROM public.lead_generation_assignments a
    WHERE a.outcome = 'pending'
      AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
      AND (p_agent_id IS NULL OR a.agent_id = p_agent_id)
  ),
  fu AS (
    SELECT b.id
    FROM base b
    WHERE b.commercial_pipeline_status = 'follow_up'
  ),
  act AS (
    SELECT
      aa.assignment_id,
      BOOL_OR(aa.next_action_at < p_now AND aa.next_action_at IS NOT NULL) AS has_overdue,
      MIN(aa.next_action_at) FILTER (WHERE aa.next_action_at >= p_now) AS next_future
    FROM public.lead_generation_assignment_activities aa
    WHERE aa.next_action_at IS NOT NULL
      AND aa.assignment_id IN (SELECT id FROM fu)
    GROUP BY aa.assignment_id
  ),
  fu_class AS (
    SELECT
      f.id,
      COALESCE(x.has_overdue, false) AS overdue,
      x.next_future
    FROM fu f
    LEFT JOIN act x ON x.assignment_id = f.id
  )
  SELECT
    (SELECT COUNT(*)::bigint FROM base WHERE commercial_pipeline_status = 'new' AND assigned_at >= v_2h),
    (SELECT COUNT(*)::bigint FROM base WHERE commercial_pipeline_status = 'new' AND assigned_at < v_2h),
    (SELECT COUNT(*)::bigint FROM base WHERE commercial_pipeline_status = 'contacted' AND last_activity_at >= v_24h),
    (
      SELECT COUNT(*)::bigint
      FROM base
      WHERE commercial_pipeline_status = 'contacted'
        AND (last_activity_at < v_24h OR last_activity_at IS NULL)
    ),
    (
      SELECT COUNT(*)::bigint
      FROM fu_class c
      WHERE NOT c.overdue
        AND c.next_future IS NOT NULL
        AND c.next_future >= v_day_start
        AND c.next_future < v_day_end_excl
    ),
    (SELECT COUNT(*)::bigint FROM fu_class WHERE overdue);
END;
$$;

COMMENT ON FUNCTION public.lead_generation_cockpit_portfolio_aging IS
  'Buckets d’ancienneté ; « rappel dû aujourd’hui » = Europe/Paris, relance future dans le jour civil.';

-- -----------------------------------------------------------------------------
-- 3) Vélocité (vue milestones + journal conversions)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lead_generation_cockpit_velocity_metrics (
  p_agent_id uuid,
  p_window_start timestamptz,
  p_window_end timestamptz
)
RETURNS TABLE (
  avg_assignment_to_first_contact_seconds double precision,
  avg_assignment_to_conversion_seconds double precision,
  avg_first_contact_to_conversion_seconds double precision,
  first_contact_within_2h_count bigint,
  converted_within_24h_from_assign_count bigint,
  milestones_sample_size bigint,
  sample_size_first_contact_pair bigint,
  sample_size_conversion_pair bigint,
  conversions_in_period bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH m AS (
    SELECT *
    FROM public.lead_generation_assignment_event_milestones mv
    WHERE (p_agent_id IS NULL OR mv.agent_id = p_agent_id)
      AND mv.assigned_event_at IS NOT NULL
      AND mv.assigned_event_at >= p_window_start
      AND mv.assigned_event_at < p_window_end
  ),
  ev AS (
    SELECT COUNT(*)::bigint AS c
    FROM public.lead_generation_assignment_events e
    WHERE e.event_type = 'moved_to_converted'
      AND e.occurred_at >= p_window_start
      AND e.occurred_at < p_window_end
      AND (p_agent_id IS NULL OR e.agent_id = p_agent_id)
  )
  SELECT
    (
      SELECT AVG(EXTRACT(EPOCH FROM (mm.first_contact_event_at - mm.assigned_event_at)))
      FROM m mm
      WHERE mm.first_contact_event_at IS NOT NULL
    ),
    (
      SELECT AVG(EXTRACT(EPOCH FROM (mm.converted_event_at - mm.assigned_event_at)))
      FROM m mm
      WHERE mm.converted_event_at IS NOT NULL
    ),
    (
      SELECT AVG(EXTRACT(EPOCH FROM (mm.converted_event_at - mm.first_contact_event_at)))
      FROM m mm
      WHERE mm.converted_event_at IS NOT NULL
        AND mm.first_contact_event_at IS NOT NULL
    ),
    (
      SELECT COUNT(*)::bigint
      FROM m mm
      WHERE mm.first_contact_event_at IS NOT NULL
        AND (mm.first_contact_event_at - mm.assigned_event_at) <= interval '2 hours'
    ),
    (
      SELECT COUNT(*)::bigint
      FROM m mm
      WHERE mm.converted_event_at IS NOT NULL
        AND (mm.converted_event_at - mm.assigned_event_at) <= interval '24 hours'
    ),
    (SELECT COUNT(*)::bigint FROM m mm),
    (SELECT COUNT(*)::bigint FROM m mm WHERE mm.first_contact_event_at IS NOT NULL),
    (SELECT COUNT(*)::bigint FROM m mm WHERE mm.converted_event_at IS NOT NULL),
    (SELECT c FROM ev);
$$;

COMMENT ON FUNCTION public.lead_generation_cockpit_velocity_metrics IS
  'Moyennes sur lignes milestone dans la fenêtre [p_window_start, p_window_end) ; conversions = journal.';

-- -----------------------------------------------------------------------------
-- 4) Lignes agents (métriques agrégées + politique dispatch)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lead_generation_cockpit_agent_rows (
  p_agent_id uuid,
  p_window_start timestamptz,
  p_window_end timestamptz
)
RETURNS TABLE (
  agent_id uuid,
  agent_name text,
  agent_email text,
  stock_neuf bigint,
  suivi_total bigint,
  sla_warning bigint,
  sla_breached bigint,
  appels_total bigint,
  first_contacts_total bigint,
  converted_total bigint,
  avg_assignment_to_first_contact_seconds double precision,
  avg_assignment_to_conversion_seconds double precision,
  effective_cap_multiplier double precision,
  effective_stock_cap integer,
  injection_suspended boolean,
  suspension_reason text
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH agents AS (
    SELECT p.id, p.full_name, p.email
    FROM public.profiles p
    WHERE p.id IN (SELECT user_id FROM public.lead_generation_sales_agent_ids())
      AND (p_agent_id IS NULL OR p.id = p_agent_id)
  ),
  assign AS (
    SELECT
      a.agent_id,
      COUNT(*) FILTER (
        WHERE a.commercial_pipeline_status = 'new'
      )::bigint AS stock_neuf,
      COUNT(*) FILTER (
        WHERE a.commercial_pipeline_status IN ('contacted', 'follow_up')
      )::bigint AS suivi_total,
      COUNT(*) FILTER (WHERE a.sla_status = 'warning')::bigint AS sla_warning,
      COUNT(*) FILTER (WHERE a.sla_status = 'breached')::bigint AS sla_breached,
      COUNT(*)::bigint AS pending_total
    FROM public.lead_generation_assignments a
    WHERE a.outcome = 'pending'
      AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
      AND a.agent_id IN (SELECT id FROM agents)
    GROUP BY a.agent_id
  ),
  calls AS (
    SELECT
      a.agent_id,
      COUNT(*)::bigint AS n
    FROM public.lead_generation_assignment_activities a
    WHERE a.activity_type = 'call'
      AND a.activity_label IS DISTINCT FROM 'Appel lancé — complétez le compte rendu'
      AND a.agent_id IN (SELECT id FROM agents)
    GROUP BY a.agent_id
  ),
  evp AS (
    SELECT
      e.agent_id,
      COUNT(*) FILTER (WHERE e.event_type = 'first_contact')::bigint AS fc,
      COUNT(*) FILTER (WHERE e.event_type = 'moved_to_converted')::bigint AS cv
    FROM public.lead_generation_assignment_events e
    WHERE e.occurred_at >= p_window_start
      AND e.occurred_at < p_window_end
      AND e.agent_id IN (SELECT id FROM agents)
      AND e.event_type IN ('first_contact', 'moved_to_converted')
    GROUP BY e.agent_id
  ),
  mile AS (
    SELECT
      mv.agent_id,
      AVG(EXTRACT(EPOCH FROM (mv.first_contact_event_at - mv.assigned_event_at))) FILTER (
        WHERE mv.first_contact_event_at IS NOT NULL
      ) AS s1,
      AVG(EXTRACT(EPOCH FROM (mv.converted_event_at - mv.assigned_event_at))) FILTER (
        WHERE mv.converted_event_at IS NOT NULL
      ) AS s2
    FROM public.lead_generation_assignment_event_milestones mv
    WHERE mv.agent_id IN (SELECT id FROM agents)
      AND mv.assigned_event_at IS NOT NULL
      AND mv.assigned_event_at >= p_window_start
      AND mv.assigned_event_at < p_window_end
    GROUP BY mv.agent_id
  )
  SELECT
    ag.id,
    COALESCE(NULLIF(trim(BOTH FROM ag.full_name), ''), ag.email, 'Sans nom')::text,
    ag.email::text,
    COALESCE(s.stock_neuf, 0),
    COALESCE(s.suivi_total, 0),
    COALESCE(s.sla_warning, 0),
    COALESCE(s.sla_breached, 0),
    COALESCE(c.n, 0),
    COALESCE(e.fc, 0),
    COALESCE(e.cv, 0),
    mile.s1,
    mile.s2,
    CASE
      WHEN COALESCE(s.suivi_total, 0) >= 80 OR COALESCE(s.sla_breached, 0) >= 12 THEN 1::double precision
      WHEN COALESCE(s.pending_total, 0) = 0 THEN 1::double precision
      WHEN (COALESCE(s.sla_breached, 0)::double precision / GREATEST(s.pending_total, 1)::double precision) >= 0.25
        THEN 0.85::double precision
      WHEN (COALESCE(s.sla_breached, 0)::double precision / GREATEST(s.pending_total, 1)::double precision) <= 0.05
        AND COALESCE(s.pending_total, 0) >= 5
        THEN 1.08::double precision
      ELSE 1::double precision
    END AS mlt,
    LEAST(
      110,
      GREATEST(
        50,
        ROUND(
          100.0 * (
            CASE
              WHEN COALESCE(s.suivi_total, 0) >= 80 OR COALESCE(s.sla_breached, 0) >= 12 THEN 1.0
              WHEN COALESCE(s.pending_total, 0) = 0 THEN 1.0
              WHEN (COALESCE(s.sla_breached, 0)::double precision / GREATEST(s.pending_total, 1)::double precision) >= 0.25
                THEN 0.85
              WHEN (COALESCE(s.sla_breached, 0)::double precision / GREATEST(s.pending_total, 1)::double precision) <= 0.05
                AND COALESCE(s.pending_total, 0) >= 5
                THEN 1.08
              ELSE 1.0
            END
          )
        )::integer
      )
    )::integer,
    (COALESCE(s.suivi_total, 0) >= 80 OR COALESCE(s.sla_breached, 0) >= 12),
    CASE
      WHEN COALESCE(s.suivi_total, 0) >= 80 THEN format(
        'Suivi saturé (%s fiches Contacté / À rappeler). Traitez avant nouvelle injection.',
        s.suivi_total
      )::text
      WHEN COALESCE(s.sla_breached, 0) >= 12 THEN format(
        'Trop d’échéances en retard (%s).',
        s.sla_breached
      )::text
      ELSE NULL::text
    END
  FROM agents ag
  LEFT JOIN assign s ON s.agent_id = ag.id
  LEFT JOIN calls c ON c.agent_id = ag.id
  LEFT JOIN evp e ON e.agent_id = ag.id
  LEFT JOIN mile mile ON mile.agent_id = ag.id
  ORDER BY
    COALESCE(e.cv, 0) DESC,
    COALESCE(NULLIF(trim(BOTH FROM ag.full_name), ''), ag.email, 'Sans nom') ASC;
END;
$$;

COMMENT ON FUNCTION public.lead_generation_cockpit_agent_rows IS
  'Une ligne par agent sales ; plafond = computeEffectiveLeadGenStockCap(100, multiplier).';

-- -----------------------------------------------------------------------------
-- 5) Dispatch (compteurs + JSON motifs + timeline)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lead_generation_cockpit_dispatch_health (
  p_window_end timestamptz
)
RETURNS TABLE (
  agents_eligibles bigint,
  agents_suspendus bigint,
  agents_total_sales bigint,
  avg_effective_cap integer,
  assigned_count_24h bigint,
  assigned_count_7d bigint,
  dispatch_blocked_count_24h bigint,
  dispatch_blocked_count_7d bigint,
  dispatch_resumed_count_24h bigint,
  dispatch_resumed_count_7d bigint,
  top_block_reasons jsonb,
  recent_dispatch_events jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_start_24h timestamptz := p_window_end - interval '24 hours';
  v_start_7d timestamptz := p_window_end - interval '7 days';
BEGIN
  RETURN QUERY
  WITH agents AS (
    SELECT p.id
    FROM public.profiles p
    WHERE p.id IN (SELECT user_id FROM public.lead_generation_sales_agent_ids())
  ),
  assign AS (
    SELECT
      a.agent_id,
      COUNT(*) FILTER (
        WHERE a.commercial_pipeline_status IN ('contacted', 'follow_up')
      )::bigint AS suivi_total,
      COUNT(*) FILTER (WHERE a.sla_status = 'breached')::bigint AS sla_breached,
      COUNT(*)::bigint AS pending_total
    FROM public.lead_generation_assignments a
    WHERE a.outcome = 'pending'
      AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
      AND a.agent_id IN (SELECT id FROM agents)
    GROUP BY a.agent_id
  ),
  pol AS (
    SELECT
      a.id AS agent_id,
      CASE
        WHEN COALESCE(s.suivi_total, 0) >= 80 OR COALESCE(s.sla_breached, 0) >= 12 THEN true
        ELSE false
      END AS suspended,
      LEAST(
        110,
        GREATEST(
          50,
          ROUND(
            100.0 * (
              CASE
                WHEN COALESCE(s.suivi_total, 0) >= 80 OR COALESCE(s.sla_breached, 0) >= 12 THEN 1.0
                WHEN COALESCE(s.pending_total, 0) = 0 THEN 1.0
                WHEN (COALESCE(s.sla_breached, 0)::double precision / GREATEST(s.pending_total, 1)::double precision) >= 0.25
                  THEN 0.85
                WHEN (COALESCE(s.sla_breached, 0)::double precision / GREATEST(s.pending_total, 1)::double precision) <= 0.05
                  AND COALESCE(s.pending_total, 0) >= 5
                  THEN 1.08
                ELSE 1.0
              END
            )
          )::integer
        )
      )::integer AS cap
    FROM agents a
    LEFT JOIN assign s ON s.agent_id = a.id
  ),
  reasons AS (
    SELECT *
    FROM (
      SELECT
        COALESCE(NULLIF(trim(BOTH FROM e.metadata_json->>'reason'), ''), 'inconnu') AS reason,
        COUNT(*)::bigint AS c
      FROM public.lead_generation_assignment_events e
      WHERE e.event_type = 'dispatch_blocked'
        AND e.occurred_at >= v_start_7d
        AND e.occurred_at < p_window_end
      GROUP BY COALESCE(NULLIF(trim(BOTH FROM e.metadata_json->>'reason'), ''), 'inconnu')
    ) z
    ORDER BY z.c DESC
    LIMIT 5
  ),
  recent AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'event_type', e.event_type,
        'occurred_at', e.occurred_at,
        'agent_id', e.agent_id,
        'agent_display_name', COALESCE(NULLIF(trim(BOTH FROM pr.full_name), ''), pr.email, 'Agent'),
        'summary',
          CASE e.event_type
            WHEN 'dispatch_blocked' THEN COALESCE(e.metadata_json->>'reason', 'Blocage')
            ELSE format(
              'Reprise%s',
              CASE
                WHEN (e.metadata_json->>'assigned_count') IS NOT NULL
                  THEN format(' (%s)', e.metadata_json->>'assigned_count')
                ELSE ''
              END
            )
          END
      )
      ORDER BY e.occurred_at DESC
    ) AS j
    FROM (
      SELECT *
      FROM public.lead_generation_assignment_events x
      WHERE x.event_type IN ('dispatch_blocked', 'dispatch_resumed')
      ORDER BY x.occurred_at DESC
      LIMIT 25
    ) e
    JOIN public.profiles pr ON pr.id = e.agent_id
  )
  SELECT
    (SELECT COUNT(*)::bigint FROM pol WHERE NOT pol.suspended) AS agents_eligibles,
    (SELECT COUNT(*)::bigint FROM pol WHERE pol.suspended) AS agents_suspendus,
    (SELECT COUNT(*)::bigint FROM agents) AS agents_total_sales,
    COALESCE((SELECT ROUND(AVG(pol.cap))::integer FROM pol), 0) AS avg_effective_cap,
    (
      SELECT COUNT(*)::bigint
      FROM public.lead_generation_assignment_events e
      WHERE e.event_type = 'assigned'
        AND e.occurred_at >= v_start_24h
        AND e.occurred_at < p_window_end
    ),
    (
      SELECT COUNT(*)::bigint
      FROM public.lead_generation_assignment_events e
      WHERE e.event_type = 'assigned'
        AND e.occurred_at >= v_start_7d
        AND e.occurred_at < p_window_end
    ),
    (
      SELECT COUNT(*)::bigint
      FROM public.lead_generation_assignment_events e
      WHERE e.event_type = 'dispatch_blocked'
        AND e.occurred_at >= v_start_24h
        AND e.occurred_at < p_window_end
    ),
    (
      SELECT COUNT(*)::bigint
      FROM public.lead_generation_assignment_events e
      WHERE e.event_type = 'dispatch_blocked'
        AND e.occurred_at >= v_start_7d
        AND e.occurred_at < p_window_end
    ),
    (
      SELECT COUNT(*)::bigint
      FROM public.lead_generation_assignment_events e
      WHERE e.event_type = 'dispatch_resumed'
        AND e.occurred_at >= v_start_24h
        AND e.occurred_at < p_window_end
    ),
    (
      SELECT COUNT(*)::bigint
      FROM public.lead_generation_assignment_events e
      WHERE e.event_type = 'dispatch_resumed'
        AND e.occurred_at >= v_start_7d
        AND e.occurred_at < p_window_end
    ),
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('reason', r.reason, 'count', r.c)) FROM reasons r),
      '[]'::jsonb
    ),
    COALESCE((SELECT j FROM recent), '[]'::jsonb);
END;
$$;

COMMENT ON FUNCTION public.lead_generation_cockpit_dispatch_health IS
  'Santé dispatch globale ; top_block_reasons sur 7 j glissants ; timeline 25 derniers blocages/reprises.';

-- -----------------------------------------------------------------------------
-- 6) Événements récents (filtrés)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lead_generation_cockpit_recent_events (
  p_agent_id uuid,
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_limit integer
)
RETURNS TABLE (
  id uuid,
  event_type text,
  occurred_at timestamptz,
  agent_id uuid,
  assignment_id uuid,
  metadata_json jsonb,
  agent_display_name text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    e.id,
    e.event_type,
    e.occurred_at,
    e.agent_id,
    e.assignment_id,
    e.metadata_json,
    COALESCE(NULLIF(trim(BOTH FROM p.full_name), ''), p.email, 'Agent')::text
  FROM public.lead_generation_assignment_events e
  JOIN public.profiles p ON p.id = e.agent_id
  WHERE e.event_type = ANY (
    ARRAY[
      'moved_to_converted',
      'sla_breached',
      'dispatch_blocked',
      'dispatch_resumed',
      'first_contact'
    ]::text[]
  )
    AND e.occurred_at >= p_window_start
    AND e.occurred_at < p_window_end
    AND (p_agent_id IS NULL OR e.agent_id = p_agent_id)
  ORDER BY e.occurred_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 40), 200));
$$;

COMMENT ON FUNCTION public.lead_generation_cockpit_recent_events IS
  'Flux cockpit avec libellé agent ; fenêtre [start,end).';

-- Grants
GRANT EXECUTE ON FUNCTION public.lead_generation_sales_agent_ids () TO authenticated;
GRANT EXECUTE ON FUNCTION public.lead_generation_cockpit_summary (uuid, timestamptz, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lead_generation_cockpit_portfolio_aging (uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lead_generation_cockpit_velocity_metrics (uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lead_generation_cockpit_agent_rows (uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lead_generation_cockpit_dispatch_health (timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lead_generation_cockpit_recent_events (uuid, timestamptz, timestamptz, integer) TO authenticated;
