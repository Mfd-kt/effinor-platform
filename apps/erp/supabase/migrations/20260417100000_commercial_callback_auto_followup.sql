-- Relance e-mail automatique (rappels commerciaux) — garde-fous & traçabilité
ALTER TABLE public.commercial_callbacks
  ADD COLUMN IF NOT EXISTS auto_followup_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_followup_last_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_followup_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_followup_status text,
  ADD COLUMN IF NOT EXISTS auto_followup_next_eligible_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_outbound_email_at timestamptz;

COMMENT ON COLUMN public.commercial_callbacks.auto_followup_enabled IS 'Si false, aucun envoi auto (cron ni suggestion).';
COMMENT ON COLUMN public.commercial_callbacks.auto_followup_count IS 'Nombre d’e-mails auto envoyés pour ce rappel.';
COMMENT ON COLUMN public.commercial_callbacks.auto_followup_status IS 'Dernier statut auto-relance (ex. sent, skipped_reason).';
COMMENT ON COLUMN public.commercial_callbacks.auto_followup_next_eligible_at IS 'Prochain moment où un envoi auto peut être tenté (cooldown).';

ALTER TABLE public.automation_logs
  ADD COLUMN IF NOT EXISTS callback_id uuid REFERENCES public.commercial_callbacks (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_automation_logs_callback_id ON public.automation_logs (callback_id, created_at DESC)
  WHERE callback_id IS NOT NULL;

COMMENT ON COLUMN public.automation_logs.callback_id IS 'Rappel commercial concerné (relance auto, etc.).';
