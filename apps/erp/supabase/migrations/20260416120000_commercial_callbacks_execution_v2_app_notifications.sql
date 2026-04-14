-- =============================================================================
-- Rappels commerciaux : exécution V2 + notifications applicatives
-- =============================================================================

-- --- Priorité : critical ---
ALTER TABLE public.commercial_callbacks DROP CONSTRAINT IF EXISTS commercial_callbacks_priority_check;
ALTER TABLE public.commercial_callbacks
  ADD CONSTRAINT commercial_callbacks_priority_check CHECK (
    priority IN ('low', 'normal', 'high', 'critical')
  );

-- --- Statuts : due_today, overdue (pilotage cron), rescheduled conservé ---
ALTER TABLE public.commercial_callbacks DROP CONSTRAINT IF EXISTS commercial_callbacks_status_check;
ALTER TABLE public.commercial_callbacks
  ADD CONSTRAINT commercial_callbacks_status_check CHECK (
    status IN (
      'pending',
      'due_today',
      'overdue',
      'in_progress',
      'completed',
      'no_answer',
      'rescheduled',
      'cancelled',
      'converted_to_lead',
      'cold_followup'
    )
  );

-- --- Champs métier / exécution ---
ALTER TABLE public.commercial_callbacks
  ADD COLUMN IF NOT EXISTS callback_reason text,
  ADD COLUMN IF NOT EXISTS callback_preferred_period text,
  ADD COLUMN IF NOT EXISTS callback_outcome text,
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS business_score integer,
  ADD COLUMN IF NOT EXISTS confidence_score integer,
  ADD COLUMN IF NOT EXISTS estimated_value_eur numeric(14, 2),
  ADD COLUMN IF NOT EXISTS ai_script_text text,
  ADD COLUMN IF NOT EXISTS ai_followup_draft text,
  ADD COLUMN IF NOT EXISTS ai_last_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS sequence_next_at timestamptz,
  ADD COLUMN IF NOT EXISTS in_progress_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_notification_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_in_app_alert_at timestamptz;

COMMENT ON COLUMN public.commercial_callbacks.due_at IS 'Échéance calculée (Paris) pour tri / scoring.';
COMMENT ON COLUMN public.commercial_callbacks.business_score IS 'Score 0–100, mis à jour par cron ou actions.';
COMMENT ON COLUMN public.commercial_callbacks.estimated_value_eur IS 'Valeur estimée (€) ; peut compléter estimated_value_cents.';

CREATE INDEX IF NOT EXISTS idx_commercial_callbacks_due_at ON public.commercial_callbacks (due_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_commercial_callbacks_business_score ON public.commercial_callbacks (business_score DESC) WHERE deleted_at IS NULL;

-- =============================================================================
-- Notifications applicatives (in-app)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  severity text NOT NULL DEFAULT 'info'
    CONSTRAINT app_notifications_severity_check CHECK (severity IN ('info', 'warning', 'high', 'critical')),
  entity_type text,
  entity_id uuid,
  action_url text,
  is_read boolean NOT NULL DEFAULT false,
  is_dismissed boolean NOT NULL DEFAULT false,
  metadata_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  dedupe_key text
);

CREATE INDEX IF NOT EXISTS idx_app_notifications_user_created ON public.app_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_notifications_user_unread ON public.app_notifications (user_id, is_read) WHERE is_read = false AND is_dismissed = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_notifications_dedupe ON public.app_notifications (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

COMMENT ON TABLE public.app_notifications IS 'Notifications in-app (temps réel, centre utilisateur).';

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_notifications_select_own" ON public.app_notifications;
CREATE POLICY "app_notifications_select_own"
  ON public.app_notifications FOR SELECT TO authenticated
  USING (public.is_active_profile() AND user_id = auth.uid());

DROP POLICY IF EXISTS "app_notifications_update_own" ON public.app_notifications;
CREATE POLICY "app_notifications_update_own"
  ON public.app_notifications FOR UPDATE TO authenticated
  USING (public.is_active_profile() AND user_id = auth.uid())
  WITH CHECK (public.is_active_profile() AND user_id = auth.uid());

-- INSERT : aucune policy authenticated → refusé ; cron via service_role.

GRANT SELECT, UPDATE ON public.app_notifications TO authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_notifications;
