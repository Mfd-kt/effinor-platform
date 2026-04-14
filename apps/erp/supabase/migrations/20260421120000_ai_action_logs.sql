-- Traçabilité des actions exécutées depuis les recommandations IA du cockpit (manuel uniquement par défaut).

CREATE TABLE IF NOT EXISTS public.ai_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id text NOT NULL,
  action_type text NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  executed_by text NOT NULL DEFAULT 'user' CHECK (executed_by IN ('user', 'ai')),
  status text NOT NULL CHECK (status IN ('pending', 'executed', 'failed')),
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_actor_created
  ON public.ai_action_logs (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_recommendation_actor
  ON public.ai_action_logs (recommendation_id, actor_user_id, created_at DESC);

COMMENT ON TABLE public.ai_action_logs IS 'Journal des exécutions d’actions liées aux recommandations cockpit (audit).';

ALTER TABLE public.ai_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_action_logs_select_own" ON public.ai_action_logs;
CREATE POLICY "ai_action_logs_select_own"
  ON public.ai_action_logs FOR SELECT TO authenticated
  USING (actor_user_id = auth.uid());

DROP POLICY IF EXISTS "ai_action_logs_insert_own" ON public.ai_action_logs;
CREATE POLICY "ai_action_logs_insert_own"
  ON public.ai_action_logs FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid());

GRANT SELECT, INSERT ON public.ai_action_logs TO authenticated;
