-- Étape 21 — automatisation contrôlée (journal des exécutions bornées)

CREATE TABLE public.lead_generation_automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_type text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NULL,
  triggered_by_user_id uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_summary text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_generation_automation_runs_automation_type_check CHECK (
    automation_type IN (
      'sync_pending_imports',
      'score_recent_stock',
      'evaluate_dispatch_queue_recent_stock',
      'evaluate_recycling_active_assignments'
    )
  ),
  CONSTRAINT lead_generation_automation_runs_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

COMMENT ON TABLE public.lead_generation_automation_runs IS
  'Journal des exécutions d’automatisations contrôlées lead-generation (étape 21).';

CREATE INDEX idx_lead_generation_automation_runs_automation_type ON public.lead_generation_automation_runs (
  automation_type
);

CREATE INDEX idx_lead_generation_automation_runs_status ON public.lead_generation_automation_runs (status);

CREATE INDEX idx_lead_generation_automation_runs_created_at_desc ON public.lead_generation_automation_runs (
  created_at DESC
);

DROP TRIGGER IF EXISTS set_lead_generation_automation_runs_updated_at ON public.lead_generation_automation_runs;

CREATE TRIGGER set_lead_generation_automation_runs_updated_at
  BEFORE UPDATE ON public.lead_generation_automation_runs
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.lead_generation_automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_generation_automation_runs_all_active"
  ON public.lead_generation_automation_runs
  FOR ALL
  TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());
