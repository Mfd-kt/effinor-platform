-- Étape 22 — règles métier configurables (clé/valeur JSON borné)

CREATE TABLE public.lead_generation_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text NULL,
  updated_by_user_id uuid NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lead_generation_settings IS
  'Réglages métier configurables du module lead-generation (étape 22).';

CREATE INDEX idx_lead_generation_settings_updated_at_desc ON public.lead_generation_settings (updated_at DESC);

DROP TRIGGER IF EXISTS set_lead_generation_settings_updated_at ON public.lead_generation_settings;
CREATE TRIGGER set_lead_generation_settings_updated_at
  BEFORE UPDATE ON public.lead_generation_settings
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.lead_generation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_generation_settings_all_active"
  ON public.lead_generation_settings
  FOR ALL
  TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

INSERT INTO public.lead_generation_settings (key, value, description)
VALUES
  (
    'commercial_scoring',
    '{"priority_low_max": 29, "priority_normal_min": 30, "priority_high_min": 55, "priority_critical_min": 75}'::jsonb,
    'Seuils de priorité commerciale.'
  ),
  (
    'dispatch_queue_rules',
    '{"score_ready_min": 55, "score_ready_strong": 72, "score_low_band": 30, "score_enrich_floor": 25}'::jsonb,
    'Seuils de décision de file de dispatch.'
  ),
  (
    'recycling_rules',
    '{"days_assigned_without_open": 7, "days_silence_after_last_touch": 14, "min_attempts_for_recycle": 12}'::jsonb,
    'Délais et tentatives pour éligibilité recyclage.'
  ),
  (
    'automation_limits',
    '{"sync_pending_imports_limit": 10, "score_recent_stock_limit": 50, "evaluate_dispatch_queue_limit": 50, "evaluate_recycling_limit": 50}'::jsonb,
    'Bornes des jobs d’automatisation contrôlée.'
  ),
  (
    'ui_batch_limits',
    '{"quick_score_limit": 20, "quick_enrichment_limit": 20, "quick_dispatch_queue_limit": 20, "quick_recycling_limit": 25}'::jsonb,
    'Limites par défaut des actions rapides UI.'
  )
ON CONFLICT (key) DO NOTHING;
