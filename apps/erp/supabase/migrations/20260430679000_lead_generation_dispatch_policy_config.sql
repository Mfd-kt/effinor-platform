-- Source de vérité unique pour les paramètres métier de la politique d'injection lead_generation
-- (alignée sur lib/agent-dispatch-policy.ts avant centralisation).
-- Modifiable uniquement via SQL / migration ou outil admin — lecture pour TS (PostgREST) et RPC cockpit.

CREATE TABLE IF NOT EXISTS public.lead_generation_dispatch_policy_config (
  id bigint PRIMARY KEY DEFAULT 1,
  pipeline_backlog_suspend_threshold integer NOT NULL,
  sla_breached_suspend_threshold integer NOT NULL,
  breach_ratio_penalty_threshold double precision NOT NULL,
  breach_ratio_bonus_threshold double precision NOT NULL,
  min_pending_assignments_for_bonus integer NOT NULL,
  cap_multiplier_penalty double precision NOT NULL,
  cap_multiplier_bonus double precision NOT NULL,
  cap_base_per_cee_sheet integer NOT NULL,
  effective_cap_min integer NOT NULL,
  effective_cap_max integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  CONSTRAINT lead_generation_dispatch_policy_config_singleton CHECK (id = 1),
  CONSTRAINT lead_generation_dispatch_policy_config_thresholds_positive CHECK (
    pipeline_backlog_suspend_threshold >= 0
    AND sla_breached_suspend_threshold >= 0
    AND breach_ratio_penalty_threshold >= 0
    AND breach_ratio_bonus_threshold >= 0
    AND min_pending_assignments_for_bonus >= 0
    AND cap_base_per_cee_sheet > 0
    AND effective_cap_min > 0
    AND effective_cap_max >= effective_cap_min
  )
);

COMMENT ON TABLE public.lead_generation_dispatch_policy_config IS
  'Paramètres singleton (id=1) pour suspension injection et multiplicateur de plafond — consommés par TS et RPC cockpit.';

INSERT INTO public.lead_generation_dispatch_policy_config (
  id,
  pipeline_backlog_suspend_threshold,
  sla_breached_suspend_threshold,
  breach_ratio_penalty_threshold,
  breach_ratio_bonus_threshold,
  min_pending_assignments_for_bonus,
  cap_multiplier_penalty,
  cap_multiplier_bonus,
  cap_base_per_cee_sheet,
  effective_cap_min,
  effective_cap_max
)
VALUES (
  1,
  80,
  12,
  0.25,
  0.05,
  5,
  0.85,
  1.08,
  100,
  50,
  110
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.lead_generation_dispatch_policy_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_generation_dispatch_policy_config_select"
  ON public.lead_generation_dispatch_policy_config;

CREATE POLICY "lead_generation_dispatch_policy_config_select"
  ON public.lead_generation_dispatch_policy_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Pas d’INSERT/UPDATE/DELETE via API client : maintenance par migrations ou rôle service.

COMMENT ON COLUMN public.lead_generation_dispatch_policy_config.pipeline_backlog_suspend_threshold IS
  'Suivi (contacted+follow_up) au-delà duquel l’injection est suspendue.';
COMMENT ON COLUMN public.lead_generation_dispatch_policy_config.sla_breached_suspend_threshold IS
  'Nombre de SLA breached au-delà duquel l’injection est suspendue.';
COMMENT ON COLUMN public.lead_generation_dispatch_policy_config.breach_ratio_penalty_threshold IS
  'Ratio breached/pending au-delà duquel le multiplicateur de plafond baisse.';
COMMENT ON COLUMN public.lead_generation_dispatch_policy_config.breach_ratio_bonus_threshold IS
  'Ratio breached/pending en dessous duquel un bonus peut s’appliquer (si pending suffisant).';
COMMENT ON COLUMN public.lead_generation_dispatch_policy_config.min_pending_assignments_for_bonus IS
  'Pending minimum pour activer le multiplicateur bonus.';
COMMENT ON COLUMN public.lead_generation_dispatch_policy_config.cap_multiplier_penalty IS
  'Multiplicateur appliqué au plafond lorsque le ratio de retards est élevé.';
COMMENT ON COLUMN public.lead_generation_dispatch_policy_config.cap_multiplier_bonus IS
  'Multiplicateur bonus lorsque le portefeuille est sain.';
COMMENT ON COLUMN public.lead_generation_dispatch_policy_config.cap_base_per_cee_sheet IS
  'Base (fiches) pour le plafond effectif avant bornes min/max.';
COMMENT ON COLUMN public.lead_generation_dispatch_policy_config.effective_cap_min IS
  'Plancher du plafond effectif (arrondi).';
COMMENT ON COLUMN public.lead_generation_dispatch_policy_config.effective_cap_max IS
  'Plafond du plafond effectif (arrondi).';

CREATE OR REPLACE FUNCTION public.lead_generation_dispatch_policy ()
RETURNS public.lead_generation_dispatch_policy_config
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  r public.lead_generation_dispatch_policy_config;
BEGIN
  SELECT * INTO STRICT r FROM public.lead_generation_dispatch_policy_config WHERE id = 1;
  RETURN r;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE EXCEPTION 'lead_generation_dispatch_policy: ligne id=1 absente';
  WHEN TOO_MANY_ROWS THEN
    RAISE EXCEPTION 'lead_generation_dispatch_policy: plusieurs lignes pour id=1';
END;
$$;

COMMENT ON FUNCTION public.lead_generation_dispatch_policy IS
  'Lecture stricte de la configuration active (fail fast si manquante).';

GRANT SELECT ON public.lead_generation_dispatch_policy_config TO authenticated;
GRANT EXECUTE ON FUNCTION public.lead_generation_dispatch_policy () TO authenticated;

-- -----------------------------------------------------------------------------
-- Recockpit RPC : seuils et plafonds depuis lead_generation_dispatch_policy()
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
        ) >= (SELECT pipeline_backlog_suspend_threshold FROM public.lead_generation_dispatch_policy ())
        OR COUNT(*) FILTER (WHERE b.sla_status = 'breached')
          >= (SELECT sla_breached_suspend_threshold FROM public.lead_generation_dispatch_policy ())
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
        ) >= (SELECT pipeline_backlog_suspend_threshold FROM public.lead_generation_dispatch_policy ())
          THEN 1::bigint
        WHEN (
          SELECT COUNT(*) FILTER (WHERE b.sla_status = 'breached')
          FROM public.lead_generation_assignments b
          WHERE b.agent_id = p_agent_id
            AND b.outcome = 'pending'
            AND b.assignment_status IN ('assigned', 'opened', 'in_progress')
        ) >= (SELECT sla_breached_suspend_threshold FROM public.lead_generation_dispatch_policy ())
          THEN 1::bigint
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
  'Agrégats portefeuille + conversions ; suspendus = seuils depuis lead_generation_dispatch_policy().';

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
  'Métriques agents ; plafonds depuis lead_generation_dispatch_policy().';

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
  WITH pol AS (
    SELECT * FROM public.lead_generation_dispatch_policy ()
  ),
  agents AS (
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
  pol2 AS (
    SELECT
      a.id AS agent_id,
      CASE
        WHEN COALESCE(s.suivi_total, 0) >= pol.pipeline_backlog_suspend_threshold
          OR COALESCE(s.sla_breached, 0) >= pol.sla_breached_suspend_threshold
          THEN true
        ELSE false
      END AS suspended,
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
      )::integer AS cap
    FROM agents a
    CROSS JOIN pol
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
    (SELECT COUNT(*)::bigint FROM pol2 WHERE NOT pol2.suspended) AS agents_eligibles,
    (SELECT COUNT(*)::bigint FROM pol2 WHERE pol2.suspended) AS agents_suspendus,
    (SELECT COUNT(*)::bigint FROM agents) AS agents_total_sales,
    COALESCE((SELECT ROUND(AVG(pol2.cap))::integer FROM pol2), 0) AS avg_effective_cap,
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
  'Santé dispatch ; plafonds depuis lead_generation_dispatch_policy().';

DROP TRIGGER IF EXISTS lead_generation_dispatch_policy_config_updated_at
  ON public.lead_generation_dispatch_policy_config;

CREATE TRIGGER lead_generation_dispatch_policy_config_updated_at
  BEFORE UPDATE ON public.lead_generation_dispatch_policy_config
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at ();
