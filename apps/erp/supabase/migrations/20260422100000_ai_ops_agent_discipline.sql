-- Discipline conversationnelle agent opérations : statuts étendus, sévérité, cycle de vie, cooldown.

ALTER TABLE public.ai_conversations
  DROP CONSTRAINT IF EXISTS ai_conversations_status_check;

ALTER TABLE public.ai_conversations
  ADD CONSTRAINT ai_conversations_status_check CHECK (
    status IN (
      'open',
      'awaiting_user',
      'snoozed',
      'resolved',
      'escalated',
      'auto_closed'
    )
  );

ALTER TABLE public.ai_conversations
  ADD COLUMN IF NOT EXISTS issue_type text,
  ADD COLUMN IF NOT EXISTS issue_entity_type text,
  ADD COLUMN IF NOT EXISTS issue_entity_id uuid,
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'info'
    CONSTRAINT ai_conversations_severity_check CHECK (
      severity IN ('info', 'warning', 'high', 'critical')
    ),
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_ai_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_user_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_escalated_at timestamptz,
  ADD COLUMN IF NOT EXISTS cooldown_until timestamptz,
  ADD COLUMN IF NOT EXISTS reopen_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_closed_at timestamptz;

-- Alignement avec les champs historiques entity_* (remplis côté app ; backfill léger).
UPDATE public.ai_conversations
SET
  issue_entity_type = COALESCE(issue_entity_type, entity_type),
  issue_entity_id = COALESCE(issue_entity_id, entity_id)
WHERE issue_entity_type IS NULL AND entity_type IS NOT NULL;

COMMENT ON COLUMN public.ai_conversations.issue_type IS 'Clé métier du détecteur (ex. overdue_callback, missing_fields).';
COMMENT ON COLUMN public.ai_conversations.severity IS 'Gravité UX : info, warning, high, critical.';

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_issue_open
  ON public.ai_conversations (user_id, issue_type)
  WHERE status IN ('open', 'awaiting_user', 'escalated');

CREATE OR REPLACE FUNCTION public.touch_ai_conversation_from_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sender_type = 'ai' THEN
    UPDATE public.ai_conversations
    SET
      updated_at = now(),
      last_ai_message_at = now()
    WHERE id = NEW.conversation_id;
  ELSIF NEW.sender_type = 'user' THEN
    UPDATE public.ai_conversations
    SET
      updated_at = now(),
      last_user_message_at = now()
    WHERE id = NEW.conversation_id;
  ELSE
    UPDATE public.ai_conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;
