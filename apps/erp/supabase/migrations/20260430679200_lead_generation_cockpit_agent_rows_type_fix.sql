-- Fix runtime: "structure of query does not match function result type"
-- Cause fréquente : RETURN QUERY exige des types alignés avec RETURNS TABLE
-- (ex. numeric vs double precision sur AVG/EXTRACT).

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
  WITH pol AS (
    SELECT * FROM public.lead_generation_dispatch_policy ()
  ),
  agents AS (
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
      a2.agent_id,
      COUNT(*)::bigint AS n
    FROM public.lead_generation_assignment_activities a2
    WHERE a2.activity_type = 'call'
      AND a2.activity_label IS DISTINCT FROM 'Appel lancé — complétez le compte rendu'
      AND a2.agent_id IN (SELECT id FROM agents)
    GROUP BY a2.agent_id
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
    COALESCE(s.stock_neuf, 0::bigint),
    COALESCE(s.suivi_total, 0::bigint),
    COALESCE(s.sla_warning, 0::bigint),
    COALESCE(s.sla_breached, 0::bigint),
    COALESCE(c.n, 0::bigint),
    COALESCE(e.fc, 0::bigint),
    COALESCE(e.cv, 0::bigint),
    mile.s1::double precision,
    mile.s2::double precision,
    (
      CASE
        WHEN COALESCE(s.suivi_total, 0) >= pol.pipeline_backlog_suspend_threshold
          OR COALESCE(s.sla_breached, 0) >= pol.sla_breached_suspend_threshold
          THEN 1::double precision
        WHEN COALESCE(s.pending_total, 0) = 0 THEN 1::double precision
        WHEN (COALESCE(s.sla_breached, 0)::double precision / GREATEST(s.pending_total, 1)::double precision)
          >= pol.breach_ratio_penalty_threshold
          THEN pol.cap_multiplier_penalty::double precision
        WHEN (COALESCE(s.sla_breached, 0)::double precision / GREATEST(s.pending_total, 1)::double precision)
          <= pol.breach_ratio_bonus_threshold
          AND COALESCE(s.pending_total, 0) >= pol.min_pending_assignments_for_bonus
          THEN pol.cap_multiplier_bonus::double precision
        ELSE 1::double precision
      END
    )::double precision,
    LEAST(
      pol.effective_cap_max,
      GREATEST(
        pol.effective_cap_min,
        ROUND(
          pol.cap_base_per_cee_sheet::double precision * (
            CASE
              WHEN COALESCE(s.suivi_total, 0) >= pol.pipeline_backlog_suspend_threshold
                OR COALESCE(s.sla_breached, 0) >= pol.sla_breached_suspend_threshold
                THEN 1.0
              WHEN COALESCE(s.pending_total, 0) = 0 THEN 1.0
              WHEN (COALESCE(s.sla_breached, 0)::double precision / GREATEST(s.pending_total, 1)::double precision)
                >= pol.breach_ratio_penalty_threshold
                THEN pol.cap_multiplier_penalty
              WHEN (COALESCE(s.sla_breached, 0)::double precision / GREATEST(s.pending_total, 1)::double precision)
                <= pol.breach_ratio_bonus_threshold
                AND COALESCE(s.pending_total, 0) >= pol.min_pending_assignments_for_bonus
                THEN pol.cap_multiplier_bonus
              ELSE 1.0
            END
          )
        )::integer
      )
    )::integer,
    (
      COALESCE(s.suivi_total, 0) >= pol.pipeline_backlog_suspend_threshold
      OR COALESCE(s.sla_breached, 0) >= pol.sla_breached_suspend_threshold
    )::boolean,
    (
      CASE
        WHEN COALESCE(s.suivi_total, 0) >= pol.pipeline_backlog_suspend_threshold THEN format(
          'Suivi saturé (%s fiches Contacté / À rappeler). Traitez avant nouvelle injection.',
          s.suivi_total
        )::text
        WHEN COALESCE(s.sla_breached, 0) >= pol.sla_breached_suspend_threshold THEN format(
          'Trop d’échéances en retard (%s).',
          s.sla_breached
        )::text
        ELSE NULL::text
      END
    )::text
  FROM agents ag
  CROSS JOIN pol
  LEFT JOIN assign s ON s.agent_id = ag.id
  LEFT JOIN calls c ON c.agent_id = ag.id
  LEFT JOIN evp e ON e.agent_id = ag.id
  LEFT JOIN mile mile ON mile.agent_id = ag.id
  ORDER BY
    COALESCE(e.cv, 0::bigint) DESC,
    COALESCE(NULLIF(trim(BOTH FROM ag.full_name), ''), ag.email, 'Sans nom') ASC;
END;
$$;

COMMENT ON FUNCTION public.lead_generation_cockpit_agent_rows IS
  'Métriques agents ; plafonds depuis lead_generation_dispatch_policy(). Casts explicites pour RETURN QUERY.';
