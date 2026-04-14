-- Journal des automatisations métier (Slack intelligent, assignations, relances IA)
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_type text NOT NULL,
  rule_id text,
  workflow_id uuid REFERENCES public.lead_sheet_workflows (id) ON DELETE SET NULL,
  lead_id uuid,
  dedupe_key text,
  status text NOT NULL CHECK (status IN ('success', 'skipped', 'failed')),
  slack_channel text,
  slack_event_type text,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_dedupe_created
  ON public.automation_logs (dedupe_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_logs_type_created
  ON public.automation_logs (automation_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_logs_workflow
  ON public.automation_logs (workflow_id, created_at DESC);

COMMENT ON TABLE public.automation_logs IS
  'Traçabilité automatisations : Slack ciblé, assignations workflow, brouillons / envois relance IA.';

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_logs_select_authenticated"
  ON public.automation_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "automation_logs_insert_authenticated"
  ON public.automation_logs FOR INSERT TO authenticated WITH CHECK (true);
