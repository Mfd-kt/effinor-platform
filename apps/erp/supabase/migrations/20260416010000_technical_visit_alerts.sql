-- =============================================================================
-- Alertes pilotage / audit terrain (signaux GPS, audio, compte-rendu).
-- =============================================================================

CREATE TABLE public.technical_visit_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technical_visit_id uuid NOT NULL REFERENCES public.technical_visits (id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL
    CONSTRAINT technical_visit_alerts_severity_check CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CONSTRAINT technical_visit_alerts_status_check CHECK (status IN ('open', 'dismissed', 'resolved')),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

COMMENT ON TABLE public.technical_visit_alerts IS
  'Alertes manager sur signaux terrain (GPS, audio, compte-rendu) ; V1 synchronisation par relecture état.';

CREATE UNIQUE INDEX technical_visit_alerts_one_open_per_type
  ON public.technical_visit_alerts (technical_visit_id, alert_type)
  WHERE status = 'open';

CREATE INDEX idx_technical_visit_alerts_visit_status
  ON public.technical_visit_alerts (technical_visit_id, status);

CREATE TRIGGER set_technical_visit_alerts_updated_at
  BEFORE UPDATE ON public.technical_visit_alerts FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.technical_visit_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "technical_visit_alerts_all_active"
  ON public.technical_visit_alerts FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());
