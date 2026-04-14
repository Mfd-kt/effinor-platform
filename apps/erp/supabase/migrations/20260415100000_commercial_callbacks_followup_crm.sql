-- Follow-up CRM : statuts étendus, tentatives, contexte d'appel, séquence (fondations)

ALTER TABLE public.commercial_callbacks DROP CONSTRAINT IF EXISTS commercial_callbacks_status_check;

ALTER TABLE public.commercial_callbacks
  ADD CONSTRAINT commercial_callbacks_status_check CHECK (
    status IN (
      'pending',
      'in_progress',
      'completed',
      'no_answer',
      'rescheduled',
      'cancelled',
      'converted_to_lead',
      'cold_followup'
    )
  );

ALTER TABLE public.commercial_callbacks
  ADD COLUMN IF NOT EXISTS attempts_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_call_at timestamptz,
  ADD COLUMN IF NOT EXISTS call_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS call_context_summary text,
  ADD COLUMN IF NOT EXISTS prospect_temperature text,
  ADD COLUMN IF NOT EXISTS estimated_value_cents bigint,
  ADD COLUMN IF NOT EXISTS sequence_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sequence_type text;

ALTER TABLE public.commercial_callbacks DROP CONSTRAINT IF EXISTS commercial_callbacks_prospect_temperature_check;

ALTER TABLE public.commercial_callbacks
  ADD CONSTRAINT commercial_callbacks_prospect_temperature_check CHECK (
    prospect_temperature IS NULL OR prospect_temperature IN ('hot', 'warm', 'cold')
  );

COMMENT ON COLUMN public.commercial_callbacks.attempts_count IS 'Nombre de tentatives (no_answer cumulés).';
COMMENT ON COLUMN public.commercial_callbacks.call_started_at IS 'Début session « Appeler maintenant ».';
COMMENT ON COLUMN public.commercial_callbacks.last_call_at IS 'Dernier contact téléphonique enregistré.';
COMMENT ON COLUMN public.commercial_callbacks.call_context_summary IS 'Résumé contexte / script (IA plus tard).';
COMMENT ON COLUMN public.commercial_callbacks.sequence_step IS 'Étape courante dans une séquence de relances.';
COMMENT ON COLUMN public.commercial_callbacks.sequence_type IS 'Identifiant de séquence (ex. standard_j0_j1_j3).';
