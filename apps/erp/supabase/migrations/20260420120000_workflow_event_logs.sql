-- Journal d'événements workflow structuré (métriques cockpit, audit transitions)
CREATE TABLE IF NOT EXISTS public.workflow_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.lead_sheet_workflows (id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  from_status text NULL,
  to_status text NOT NULL,
  event_type text NOT NULL CHECK (
    event_type IN (
      'created',
      'assigned_agent',
      'assigned_confirmateur',
      'assigned_closer',
      'sent_to_confirmateur',
      'sent_to_closer',
      'qualified',
      'rejected',
      'converted',
      'closed',
      'status_changed'
    )
  ),
  actor_user_id uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_event_logs_workflow_created
  ON public.workflow_event_logs (workflow_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_workflow_event_logs_lead_created
  ON public.workflow_event_logs (lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_event_logs_actor_created
  ON public.workflow_event_logs (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_event_logs_type_created
  ON public.workflow_event_logs (event_type, created_at DESC);

COMMENT ON TABLE public.workflow_event_logs IS
  'Transitions et affectations workflow (cockpit V3, SLA). Complète lead_sheet_workflow_events (journal libre).';

ALTER TABLE public.workflow_event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_event_logs_select_authenticated"
  ON public.workflow_event_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "workflow_event_logs_insert_authenticated"
  ON public.workflow_event_logs FOR INSERT TO authenticated WITH CHECK (true);
