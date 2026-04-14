-- Évolution ai_action_logs (V1) : payload, résultat structuré, message d’erreur, statut success, mise à jour par l’acteur.

ALTER TABLE public.ai_action_logs
  ADD COLUMN IF NOT EXISTS payload_json jsonb,
  ADD COLUMN IF NOT EXISTS result_json jsonb,
  ADD COLUMN IF NOT EXISTS error_message text;

UPDATE public.ai_action_logs
SET result_json = result
WHERE result IS NOT NULL AND result_json IS NULL;

ALTER TABLE public.ai_action_logs DROP COLUMN IF EXISTS result;

ALTER TABLE public.ai_action_logs DROP CONSTRAINT IF EXISTS ai_action_logs_status_check;

UPDATE public.ai_action_logs
SET status = 'success'
WHERE status = 'executed';

ALTER TABLE public.ai_action_logs
  ADD CONSTRAINT ai_action_logs_status_check
  CHECK (status IN ('pending', 'success', 'failed'));

COMMENT ON COLUMN public.ai_action_logs.payload_json IS 'Payload d’exécution (copie au moment du log).';
COMMENT ON COLUMN public.ai_action_logs.result_json IS 'Résultat structuré après exécution.';
COMMENT ON COLUMN public.ai_action_logs.error_message IS 'Message d’erreur lisible si status = failed.';

DROP POLICY IF EXISTS "ai_action_logs_update_own" ON public.ai_action_logs;
CREATE POLICY "ai_action_logs_update_own"
  ON public.ai_action_logs FOR UPDATE TO authenticated
  USING (actor_user_id = auth.uid())
  WITH CHECK (actor_user_id = auth.uid());

GRANT UPDATE ON public.ai_action_logs TO authenticated;
