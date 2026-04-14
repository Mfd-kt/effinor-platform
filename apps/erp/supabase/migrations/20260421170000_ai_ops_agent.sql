-- Agent opérationnel IA : conversations, messages, logs d’audit.

CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role_target text NOT NULL DEFAULT 'commercial'
    CONSTRAINT ai_conversations_role_target_check CHECK (
      role_target IN ('agent', 'confirmateur', 'closer', 'manager', 'direction', 'commercial')
    ),
  status text NOT NULL DEFAULT 'open'
    CONSTRAINT ai_conversations_status_check CHECK (
      status IN ('open', 'snoozed', 'resolved', 'escalated')
    ),
  topic text NOT NULL,
  priority text NOT NULL DEFAULT 'normal'
    CONSTRAINT ai_conversations_priority_check CHECK (
      priority IN ('low', 'normal', 'high', 'critical')
    ),
  dedupe_key text,
  entity_type text,
  entity_id uuid,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  awaiting_user_reply boolean NOT NULL DEFAULT false,
  snoozed_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ai_conversations_user_dedupe
  ON public.ai_conversations (user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX idx_ai_conversations_user_status_updated
  ON public.ai_conversations (user_id, status, updated_at DESC);

COMMENT ON TABLE public.ai_conversations IS 'Fil conversationnel agent opérations IA (1 utilisateur = plusieurs sujets).';

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations (id) ON DELETE CASCADE,
  sender_type text NOT NULL
    CONSTRAINT ai_messages_sender_type_check CHECK (
      sender_type IN ('ai', 'user', 'manager', 'system')
    ),
  sender_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  message_type text NOT NULL
    CONSTRAINT ai_messages_message_type_check CHECK (
      message_type IN ('alert', 'question', 'reply', 'recommendation', 'escalation', 'resolution')
    ),
  body text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  requires_action boolean NOT NULL DEFAULT false,
  action_type text,
  action_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_messages_conversation_created
  ON public.ai_messages (conversation_id, created_at ASC);

COMMENT ON TABLE public.ai_messages IS 'Messages du fil agent / utilisateur / système.';

CREATE OR REPLACE FUNCTION public.touch_ai_conversation_from_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ai_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_ai_messages_touch_conversation ON public.ai_messages;
CREATE TRIGGER tr_ai_messages_touch_conversation
  AFTER INSERT ON public.ai_messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_ai_conversation_from_message();

CREATE TABLE public.ai_ops_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.ai_conversations (id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  event_type text NOT NULL,
  channel text NOT NULL
    CONSTRAINT ai_ops_logs_channel_check CHECK (
      channel IN ('in_app', 'slack_dm', 'slack_direction', 'slack_manager', 'system')
    ),
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'success'
    CONSTRAINT ai_ops_logs_status_check CHECK (status IN ('success', 'failed', 'skipped')),
  error_message text,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_ops_logs_conversation_created
  ON public.ai_ops_logs (conversation_id, created_at DESC);

CREATE INDEX idx_ai_ops_logs_dedupe_created
  ON public.ai_ops_logs (dedupe_key, created_at DESC)
  WHERE dedupe_key IS NOT NULL;

COMMENT ON TABLE public.ai_ops_logs IS 'Audit agent opérations (messages, escalades, Slack).';

-- RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_ops_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_conversations_select_own" ON public.ai_conversations;
CREATE POLICY "ai_conversations_select_own"
  ON public.ai_conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_conversations_update_own" ON public.ai_conversations;
CREATE POLICY "ai_conversations_update_own"
  ON public.ai_conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_messages_select_own" ON public.ai_messages;
CREATE POLICY "ai_messages_select_own"
  ON public.ai_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ai_messages_insert_user_reply" ON public.ai_messages;
CREATE POLICY "ai_messages_insert_user_reply"
  ON public.ai_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'user'
    AND sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ai_ops_logs_select_direction" ON public.ai_ops_logs;
CREATE POLICY "ai_ops_logs_select_direction"
  ON public.ai_ops_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.code IN ('super_admin', 'sales_director')
    )
  );

GRANT SELECT, UPDATE ON public.ai_conversations TO authenticated;
GRANT SELECT, INSERT ON public.ai_messages TO authenticated;
GRANT SELECT ON public.ai_ops_logs TO authenticated;

-- Realtime (inbox)
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;
