-- SLA internes : règles, instances calculées, logs d’audit.
-- Idempotent : réexécutable si les objets existent déjà (SQL Editor / reprise).

CREATE TABLE IF NOT EXISTS public.internal_sla_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  entity_type text NOT NULL
    CONSTRAINT internal_sla_rules_entity_type_check CHECK (
      entity_type IN ('callback', 'lead', 'workflow', 'team', 'user')
    ),
  role_target text NOT NULL DEFAULT 'commercial'
    CONSTRAINT internal_sla_rules_role_target_check CHECK (
      role_target IN ('agent', 'confirmateur', 'closer', 'manager', 'direction', 'system', 'commercial')
    ),
  condition_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_delay_minutes integer NOT NULL,
  warning_delay_minutes integer NOT NULL,
  critical_delay_minutes integer NOT NULL,
  action_policy text NOT NULL
    CONSTRAINT internal_sla_rules_action_policy_check CHECK (
      action_policy IN ('notify', 'escalate_manager', 'escalate_direction', 'auto_reassign', 'create_task')
    ),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_sla_rules_active_entity
  ON public.internal_sla_rules (is_active, entity_type);

COMMENT ON TABLE public.internal_sla_rules IS 'Règles de délais internes (métier) — pilotées par le moteur SLA cron.';

CREATE TABLE IF NOT EXISTS public.internal_sla_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code text NOT NULL REFERENCES public.internal_sla_rules (code) ON UPDATE CASCADE ON DELETE RESTRICT,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  assigned_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  manager_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  target_due_at timestamptz NOT NULL,
  warning_due_at timestamptz NOT NULL,
  critical_due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'healthy'
    CONSTRAINT internal_sla_instances_status_check CHECK (
      status IN ('healthy', 'warning', 'breached', 'critical', 'resolved')
    ),
  resolved_at timestamptz,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_internal_sla_instances_active_dedupe
  ON public.internal_sla_instances (rule_code, entity_type, entity_id)
  WHERE status IS DISTINCT FROM 'resolved';

CREATE INDEX IF NOT EXISTS idx_internal_sla_instances_status_updated
  ON public.internal_sla_instances (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_sla_instances_assigned_status
  ON public.internal_sla_instances (assigned_user_id, status)
  WHERE assigned_user_id IS NOT NULL;

COMMENT ON TABLE public.internal_sla_instances IS 'Échéances SLA calculées par objet (une ligne active par règle + entité).';

CREATE TABLE IF NOT EXISTS public.internal_sla_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sla_instance_id uuid REFERENCES public.internal_sla_instances (id) ON DELETE SET NULL,
  rule_code text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  severity text NOT NULL,
  event_type text NOT NULL
    CONSTRAINT internal_sla_logs_event_type_check CHECK (
      event_type IN (
        'created',
        'warning',
        'breached',
        'critical',
        'resolved',
        'escalated',
        'action_taken'
      )
    ),
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_sla_logs_instance_created
  ON public.internal_sla_logs (sla_instance_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_sla_logs_rule_created
  ON public.internal_sla_logs (rule_code, created_at DESC);

COMMENT ON TABLE public.internal_sla_logs IS 'Traçabilité transitions SLA et actions.';

ALTER TABLE public.internal_sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_sla_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_sla_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "internal_sla_rules_select_authenticated" ON public.internal_sla_rules;
CREATE POLICY "internal_sla_rules_select_authenticated"
  ON public.internal_sla_rules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "internal_sla_instances_select_scope" ON public.internal_sla_instances;
CREATE POLICY "internal_sla_instances_select_scope"
  ON public.internal_sla_instances FOR SELECT TO authenticated
  USING (
    assigned_user_id = auth.uid()
    OR manager_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.code IN ('super_admin', 'sales_director')
    )
  );

DROP POLICY IF EXISTS "internal_sla_logs_select_direction" ON public.internal_sla_logs;
CREATE POLICY "internal_sla_logs_select_direction"
  ON public.internal_sla_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.code IN ('super_admin', 'sales_director')
    )
    OR EXISTS (
      SELECT 1
      FROM public.internal_sla_instances i
      WHERE i.id = internal_sla_logs.sla_instance_id
        AND (i.assigned_user_id = auth.uid() OR i.manager_user_id = auth.uid())
    )
  );

GRANT SELECT ON public.internal_sla_rules TO authenticated;
GRANT SELECT ON public.internal_sla_instances TO authenticated;
GRANT SELECT ON public.internal_sla_logs TO authenticated;

-- Seed V1 (délais en minutes depuis l’ancre)
INSERT INTO public.internal_sla_rules (
  code, name, entity_type, role_target, condition_json,
  target_delay_minutes, warning_delay_minutes, critical_delay_minutes, action_policy, is_active
) VALUES
  (
    'cb_critical_2h',
    'Rappel critique — traitement 2 h',
    'callback',
    'commercial',
    '{"priority_critical": true, "min_business_score": 75, "min_value_eur": 8000}'::jsonb,
    90, 60, 120,
    'notify',
    true
  ),
  (
    'cb_due_today_eod',
    'Rappel du jour — avant fin de journée',
    'callback',
    'commercial',
    '{"due_today": true, "warning_paris_hour": 12, "warning_paris_minute": 30, "critical_paris_hour": 18, "critical_paris_minute": 0}'::jsonb,
    0, 0, 0,
    'notify',
    true
  ),
  (
    'lead_sim_1h',
    'Lead simulateur — prise en charge 1 h',
    'lead',
    'commercial',
    '{"lead_status": "new", "min_savings_eur": 1}'::jsonb,
    55, 45, 60,
    'notify',
    true
  ),
  (
    'wf_confirmateur_24h',
    'Dossier chez confirmateur — 24 h',
    'workflow',
    'confirmateur',
    '{"workflow_status": "to_confirm"}'::jsonb,
    900, 720, 1440,
    'notify',
    true
  ),
  (
    'wf_closer_48h',
    'Dossier closer / accord — 48 h',
    'workflow',
    'closer',
    '{"workflow_status_any": ["to_close", "agreement_sent"]}'::jsonb,
    2160, 1440, 2880,
    'notify',
    true
  ),
  (
    'user_stock_inactive_manager',
    'Stock commercial bloqué — alerte manager',
    'user',
    'manager',
    '{"min_open_stock": 3, "stale_hours": 72}'::jsonb,
    4320, 2880, 5760,
    'escalate_manager',
    true
  )
ON CONFLICT (code) DO NOTHING;
