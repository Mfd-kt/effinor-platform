-- Libération atomique du portefeuille lead_generation d'un agent inactif.

-- Accélère la sélection des assignations vivantes à libérer.
CREATE INDEX IF NOT EXISTS idx_lg_assignments_release_inactive_candidates
  ON public.lead_generation_assignments (agent_id, assignment_status, outcome, commercial_pipeline_status)
  WHERE outcome = 'pending'
    AND assignment_status IN ('assigned', 'opened', 'in_progress')
    AND created_lead_id IS NULL;

CREATE OR REPLACE FUNCTION public.release_lead_generation_assignments_for_inactive_agent(
  p_agent_user_id uuid,
  p_reason text DEFAULT 'inactive_user',
  p_actor_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  target_agent_user_id uuid,
  released_assignments_count integer,
  released_stock_count integer,
  unassigned_open_leads_count integer,
  skipped_terminal_count integer,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_released_assignments integer := 0;
  v_released_stocks integer := 0;
  v_unassigned_open_leads integer := 0;
  v_skipped_terminal integer := 0;
BEGIN
  IF p_agent_user_id IS NULL THEN
    RAISE EXCEPTION 'p_agent_user_id is required';
  END IF;

  -- Le use case métier cible un agent inactif (paused/disabled/deleted).
  IF EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_agent_user_id
      AND p.is_active = true
      AND coalesce(p.account_lifecycle_status, 'active') = 'active'
      AND p.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Agent % is active; release is only allowed for inactive lifecycle states', p_agent_user_id;
  END IF;

  CREATE TEMP TABLE tmp_lg_release_candidates ON COMMIT DROP AS
  SELECT
    a.id AS assignment_id,
    s.id AS stock_id,
    a.commercial_pipeline_status
  FROM public.lead_generation_assignments a
  JOIN public.lead_generation_stock s
    ON s.id = a.stock_id
  WHERE a.agent_id = p_agent_user_id
    AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
    AND a.outcome = 'pending'
    AND a.created_lead_id IS NULL
    AND s.current_assignment_id = a.id
    AND s.converted_lead_id IS NULL
    AND s.stock_status NOT IN ('converted', 'rejected', 'archived', 'expired')
    AND coalesce(a.commercial_pipeline_status, 'new') <> 'converted'
  FOR UPDATE OF a, s SKIP LOCKED;

  v_released_assignments := (SELECT count(*)::integer FROM tmp_lg_release_candidates);

  -- Mesure observabilité: assignations actives "pending" non libérées car terminales côté stock/pipeline.
  SELECT count(*)::integer
  INTO v_skipped_terminal
  FROM public.lead_generation_assignments a
  JOIN public.lead_generation_stock s
    ON s.id = a.stock_id
  WHERE a.agent_id = p_agent_user_id
    AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
    AND a.outcome = 'pending'
    AND a.created_lead_id IS NULL
    AND (
      s.current_assignment_id IS DISTINCT FROM a.id
      OR s.converted_lead_id IS NOT NULL
      OR s.stock_status IN ('converted', 'rejected', 'archived', 'expired')
      OR coalesce(a.commercial_pipeline_status, 'new') = 'converted'
    );

  UPDATE public.lead_generation_assignments a
  SET
    assignment_status = 'recycled',
    recycle_status = 'recycled',
    recycle_reason = 'inactive_agent_release',
    recycled_count = coalesce(a.recycled_count, 0) + 1,
    recycled_at = v_now,
    last_recycled_at = v_now,
    last_activity_at = v_now,
    updated_at = v_now
  WHERE a.id IN (SELECT assignment_id FROM tmp_lg_release_candidates)
    AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
    AND a.outcome = 'pending'
    AND a.created_lead_id IS NULL;

  UPDATE public.lead_generation_stock s
  SET
    current_assignment_id = NULL,
    stock_status = 'ready',
    dispatch_queue_status = 'review',
    dispatch_queue_reason = 'agent_inactive_release',
    dispatch_queue_evaluated_at = NULL,
    updated_at = v_now
  WHERE s.id IN (SELECT stock_id FROM tmp_lg_release_candidates)
    AND s.current_assignment_id IN (SELECT assignment_id FROM tmp_lg_release_candidates)
    AND s.stock_status IN ('assigned', 'in_progress', 'ready');

  GET DIAGNOSTICS v_released_stocks = ROW_COUNT;

  UPDATE public.leads l
  SET assigned_to = NULL
  WHERE l.assigned_to = p_agent_user_id
    AND l.lead_status NOT IN ('lost', 'converted');

  GET DIAGNOSTICS v_unassigned_open_leads = ROW_COUNT;

  INSERT INTO public.lead_generation_assignment_events (
    assignment_id,
    agent_id,
    lead_generation_stock_id,
    event_type,
    from_commercial_pipeline_status,
    to_commercial_pipeline_status,
    from_outcome,
    to_outcome,
    occurred_at,
    metadata_json
  )
  SELECT
    c.assignment_id,
    p_agent_user_id,
    c.stock_id,
    'released_inactive_agent',
    coalesce(c.commercial_pipeline_status, 'new'),
    coalesce(c.commercial_pipeline_status, 'new'),
    'pending',
    'pending',
    v_now,
    jsonb_build_object(
      'source', 'release_inactive_agent_rpc',
      'reason', coalesce(nullif(trim(p_reason), ''), 'inactive_user')
    )
  FROM tmp_lg_release_candidates c;

  INSERT INTO public.user_lifecycle_events (
    user_id,
    actor_user_id,
    event_type,
    metadata_json,
    created_at
  )
  VALUES (
    p_agent_user_id,
    p_actor_user_id,
    'assignments_released',
    jsonb_build_object(
      'reason', coalesce(nullif(trim(p_reason), ''), 'inactive_user'),
      'released_count', v_released_assignments,
      'released_stock_count', v_released_stocks,
      'unassigned_open_leads_count', v_unassigned_open_leads,
      'skipped_terminal_count', v_skipped_terminal
    ),
    v_now
  );

  RETURN QUERY
  SELECT
    p_agent_user_id,
    v_released_assignments,
    v_released_stocks,
    v_unassigned_open_leads,
    v_skipped_terminal,
    coalesce(nullif(trim(p_reason), ''), 'inactive_user');
END;
$$;

COMMENT ON FUNCTION public.release_lead_generation_assignments_for_inactive_agent(uuid, text, uuid) IS
  'Libère atomiquement le portefeuille lead_generation vivant d''un agent inactif (recycle assignations + remet stock en ready + désassigne leads CRM ouverts + journalise).';

GRANT EXECUTE ON FUNCTION public.release_lead_generation_assignments_for_inactive_agent(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_lead_generation_assignments_for_inactive_agent(uuid, text, uuid) TO service_role;

