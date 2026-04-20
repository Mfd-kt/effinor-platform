-- =============================================================================
-- Retour commercial → quantification (sans hors cible) + colonnes de traçabilité.
-- =============================================================================

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS returned_from_commercial_at timestamptz,
  ADD COLUMN IF NOT EXISTS returned_from_commercial_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS returned_from_commercial_note text;

COMMENT ON COLUMN public.lead_generation_stock.returned_from_commercial_at IS
  'Dernier renvoi par un commercial vers la file quantification / à revoir.';
COMMENT ON COLUMN public.lead_generation_stock.returned_from_commercial_by_user_id IS
  'Commercial ayant renvoyé la fiche pour relecture.';
COMMENT ON COLUMN public.lead_generation_stock.returned_from_commercial_note IS
  'Motif libre court (optionnel) lors du renvoi.';

CREATE INDEX IF NOT EXISTS idx_lead_generation_stock_returned_from_commercial_at
  ON public.lead_generation_stock (returned_from_commercial_at DESC)
  WHERE returned_from_commercial_at IS NOT NULL;

-- Nouvel outcome d’assignation : renvoi quantification (pas hors cible).
ALTER TABLE public.lead_generation_assignments
  DROP CONSTRAINT IF EXISTS lead_generation_assignments_outcome_check;

ALTER TABLE public.lead_generation_assignments
  ADD CONSTRAINT lead_generation_assignments_outcome_check CHECK (
    outcome IN (
      'pending',
      'converted_to_lead',
      'out_of_target',
      'cancelled',
      'invalid_data',
      'duplicate',
      'no_answer_exhausted',
      'returned_to_quantification'
    )
  );

-- Revues manuelles : audit renvoi commercial.
ALTER TABLE public.lead_generation_manual_reviews
  DROP CONSTRAINT IF EXISTS lead_generation_manual_reviews_review_type_check;

ALTER TABLE public.lead_generation_manual_reviews
  ADD CONSTRAINT lead_generation_manual_reviews_review_type_check CHECK (
    review_type IN (
      'duplicate_review',
      'dispatch_review',
      'enrichment_review',
      'stock_review',
      'quantifier_review',
      'agent_return_review'
    )
  );

ALTER TABLE public.lead_generation_manual_reviews
  DROP CONSTRAINT IF EXISTS lead_generation_manual_reviews_review_decision_check;

ALTER TABLE public.lead_generation_manual_reviews
  ADD CONSTRAINT lead_generation_manual_reviews_review_decision_check CHECK (
    review_decision IN (
      'confirm_duplicate',
      'restore_from_duplicate',
      'force_ready_now',
      'force_review',
      'force_do_not_dispatch',
      'confirm_verified_enrichment',
      'reject_enrichment_suggestions',
      'clear_enrichment_suggestions',
      'reopen_stock',
      'close_stock',
      'quantifier_qualify',
      'quantifier_out_of_target',
      'commercial_return_to_quantification'
    )
  );

-- Transaction : clôture assignation + remise en to_validate pour le quantificateur.
CREATE OR REPLACE FUNCTION public.return_lead_generation_assignment_to_quantification(
  p_assignment_id uuid,
  p_agent_id uuid,
  p_note text
)
RETURNS TABLE (
  result_code text
)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_assignment public.lead_generation_assignments%ROWTYPE;
  v_stock public.lead_generation_stock%ROWTYPE;
  v_stock_rows integer;
  v_note text;
BEGIN
  v_note := NULLIF(trim(COALESCE(p_note, '')), '');

  SELECT *
  INTO v_assignment
  FROM public.lead_generation_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::text;
    RETURN;
  END IF;

  IF v_assignment.agent_id IS DISTINCT FROM p_agent_id THEN
    RETURN QUERY SELECT 'forbidden'::text;
    RETURN;
  END IF;

  IF v_assignment.created_lead_id IS NOT NULL THEN
    RETURN QUERY SELECT 'already_converted'::text;
    RETURN;
  END IF;

  IF v_assignment.outcome IS DISTINCT FROM 'pending' THEN
    RETURN QUERY SELECT 'invalid_assignment_state'::text;
    RETURN;
  END IF;

  IF v_assignment.assignment_status NOT IN ('assigned', 'opened', 'in_progress') THEN
    RETURN QUERY SELECT 'invalid_assignment_state'::text;
    RETURN;
  END IF;

  SELECT *
  INTO v_stock
  FROM public.lead_generation_stock
  WHERE id = v_assignment.stock_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'stock_not_found'::text;
    RETURN;
  END IF;

  IF v_stock.converted_lead_id IS NOT NULL THEN
    RETURN QUERY SELECT 'already_converted'::text;
    RETURN;
  END IF;

  IF v_stock.current_assignment_id IS DISTINCT FROM p_assignment_id THEN
    RETURN QUERY SELECT 'stock_mismatch'::text;
    RETURN;
  END IF;

  IF v_stock.qualification_status IS DISTINCT FROM 'qualified' THEN
    RETURN QUERY SELECT 'not_qualified_for_return'::text;
    RETURN;
  END IF;

  UPDATE public.lead_generation_assignments
  SET
    last_call_status = 'Retour quantification',
    last_call_at = now(),
    last_call_note = COALESCE(v_note, 'Retour quantification — à revoir côté acquisition.'),
    outcome = 'returned_to_quantification',
    outcome_reason = 'commercial_return_to_quantification',
    assignment_status = 'consumed',
    consumed_at = now(),
    last_activity_at = now(),
    recycle_status = 'closed',
    updated_at = now()
  WHERE id = p_assignment_id;

  UPDATE public.lead_generation_stock
  SET
    qualification_status = 'to_validate',
    stock_status = CASE
      WHEN v_stock.normalized_phone IS NOT NULL AND trim(v_stock.normalized_phone) <> '' THEN 'ready'
      ELSE 'new'
    END,
    current_assignment_id = NULL,
    rejection_reason = NULL,
    dispatch_queue_status = 'review',
    dispatch_queue_reason = 'Retour commercial — à revoir en quantification.',
    dispatch_queue_evaluated_at = now(),
    returned_from_commercial_at = now(),
    returned_from_commercial_by_user_id = p_agent_id,
    returned_from_commercial_note = v_note,
    updated_at = now()
  WHERE id = v_stock.id
    AND current_assignment_id = p_assignment_id;

  GET DIAGNOSTICS v_stock_rows = ROW_COUNT;
  IF v_stock_rows <> 1 THEN
    RAISE EXCEPTION 'lead_generation_return_to_quant_stock_rows:%', v_stock_rows;
  END IF;

  RETURN QUERY SELECT 'success'::text;
END;
$$;

COMMENT ON FUNCTION public.return_lead_generation_assignment_to_quantification IS
  'Commercial : consomme l’assignation et remet la fiche en to_validate pour le quantificateur (pas hors cible).';

GRANT EXECUTE ON FUNCTION public.return_lead_generation_assignment_to_quantification(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_lead_generation_assignment_to_quantification(uuid, uuid, text) TO service_role;
