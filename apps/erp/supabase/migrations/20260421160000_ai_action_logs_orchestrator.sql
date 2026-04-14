-- Traçabilité orchestrateur IA + lecture direction (logs exécutés par l’IA).

ALTER TABLE public.ai_action_logs
  ADD COLUMN IF NOT EXISTS trigger_source text,
  ADD COLUMN IF NOT EXISTS reason text;

COMMENT ON COLUMN public.ai_action_logs.trigger_source IS 'Origine du déclenchement (ex. ai_orchestrator).';
COMMENT ON COLUMN public.ai_action_logs.reason IS 'Motif / justification métier (texte IA ou règle).';

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_trigger_created
  ON public.ai_action_logs (trigger_source, created_at DESC)
  WHERE trigger_source IS NOT NULL;

DROP POLICY IF EXISTS "ai_action_logs_select_direction_ai" ON public.ai_action_logs;
CREATE POLICY "ai_action_logs_select_direction_ai"
  ON public.ai_action_logs FOR SELECT TO authenticated
  USING (
    executed_by = 'ai'
    AND EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.code IN ('super_admin', 'sales_director')
    )
  );
