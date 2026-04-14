-- Journal des notifications sortantes (Slack, futurs canaux)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  provider text NOT NULL DEFAULT 'slack',
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  event_type text,
  entity_type text,
  entity_id text,
  payload_json jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_event ON public.notification_logs (event_type);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_logs_select_authenticated"
  ON public.notification_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "notification_logs_insert_authenticated"
  ON public.notification_logs FOR INSERT TO authenticated WITH CHECK (true);

COMMENT ON TABLE public.notification_logs IS 'Traçabilité des envois de notifications (Slack, email, in-app à venir).';
