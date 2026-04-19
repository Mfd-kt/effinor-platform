-- Rappels orphelins (assignation NULL, ex. profil agent supprimé) : rattacher au créateur pour rester visibles en RLS.
UPDATE public.commercial_callbacks
SET assigned_agent_user_id = created_by_user_id
WHERE assigned_agent_user_id IS NULL
  AND created_by_user_id IS NOT NULL
  AND deleted_at IS NULL;
