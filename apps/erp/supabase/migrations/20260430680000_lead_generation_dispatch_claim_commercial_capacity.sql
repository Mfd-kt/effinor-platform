-- Garde-fou capacité commerciale : pas d’attribution si volume opérationnel (stock neuf + suivi) ≥ 120
-- sur assignations pending actives, hors stock converti / rejeté / archivé / expiré.

DROP FUNCTION IF EXISTS public.dispatch_lead_generation_stock_claim(
  uuid, integer, integer, uuid, text, text, text, text, text, boolean, uuid
);

CREATE OR REPLACE FUNCTION public.dispatch_lead_generation_stock_claim(
  p_agent_id uuid,
  p_limit integer,
  p_batch_number integer,
  p_import_batch_id uuid DEFAULT NULL,
  p_source text DEFAULT NULL,
  p_city_ilike text DEFAULT NULL,
  p_company_name_ilike text DEFAULT NULL,
  p_closing_readiness_status text DEFAULT NULL,
  p_lead_tier text DEFAULT NULL,
  p_needs_contact_improvement boolean DEFAULT NULL,
  p_cee_sheet_id uuid DEFAULT NULL
)
RETURNS TABLE (
  stock_id uuid,
  assignment_id uuid
)
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH agent_volume AS (
    SELECT COALESCE(COUNT(*), 0)::integer AS n
    FROM public.lead_generation_assignments a
    INNER JOIN public.lead_generation_stock s ON s.id = a.stock_id
    WHERE a.agent_id = p_agent_id
      AND a.outcome = 'pending'
      AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
      AND s.converted_lead_id IS NULL
      AND s.stock_status NOT IN ('rejected', 'archived', 'expired')
      AND a.commercial_pipeline_status IN ('new', 'contacted', 'follow_up')
  ),
  picked AS (
    SELECT lgs.id
    FROM public.lead_generation_stock lgs, agent_volume v
    WHERE v.n < 120
      AND lgs.stock_status = 'ready'
      AND lgs.qualification_status = 'qualified'
      AND lgs.phone_status = 'found'
      AND lgs.current_assignment_id IS NULL
      AND lgs.dispatch_queue_status = 'ready_now'
      AND (p_import_batch_id IS NULL OR lgs.import_batch_id = p_import_batch_id)
      AND (p_source IS NULL OR lgs.source = p_source)
      AND (p_city_ilike IS NULL OR lgs.city ILIKE p_city_ilike)
      AND (p_company_name_ilike IS NULL OR lgs.company_name ILIKE p_company_name_ilike)
      AND (p_closing_readiness_status IS NULL OR lgs.closing_readiness_status = p_closing_readiness_status)
      AND (p_lead_tier IS NULL OR lgs.lead_tier = p_lead_tier)
      AND (
        p_needs_contact_improvement IS DISTINCT FROM true
        OR (
          lgs.duplicate_of_stock_id IS NULL
          AND lgs.qualification_status NOT IN ('rejected', 'duplicate')
          AND lgs.phone IS NOT NULL
          AND lgs.phone <> ''
          AND lgs.enrichment_status IN ('not_started', 'failed')
          AND (lgs.email IS NULL OR lgs.website IS NULL)
        )
      )
      AND (
        p_cee_sheet_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.lead_generation_import_batches b
          WHERE b.id = lgs.import_batch_id
            AND b.cee_sheet_id = p_cee_sheet_id
        )
      )
      AND (
        lgs.import_batch_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.lead_generation_import_batches b
          WHERE b.id = lgs.import_batch_id
            AND b.target_team_id IS NULL
        )
        OR EXISTS (
          SELECT 1
          FROM public.lead_generation_import_batches b
          INNER JOIN public.cee_sheet_team_members m
            ON m.cee_sheet_team_id = b.target_team_id
           AND m.user_id = p_agent_id
           AND m.is_active = true
          WHERE b.id = lgs.import_batch_id
            AND b.target_team_id IS NOT NULL
        )
      )
    ORDER BY lgs.dispatch_queue_rank DESC,
             lgs.commercial_score DESC,
             lgs.created_at DESC
    FOR UPDATE OF lgs SKIP LOCKED
    LIMIT greatest(0, coalesce(p_limit, 0))
  ),
  ins AS (
    INSERT INTO public.lead_generation_assignments (
      stock_id,
      agent_id,
      assignment_status,
      outcome,
      batch_number,
      assigned_at
    )
    SELECT
      picked.id,
      p_agent_id,
      'assigned',
      'pending',
      p_batch_number,
      now()
    FROM picked
    RETURNING id AS assignment_id, stock_id AS stock_id
  )
  UPDATE public.lead_generation_stock lgs
  SET
    stock_status = 'assigned',
    current_assignment_id = ins.assignment_id,
    updated_at = now()
  FROM ins
  WHERE lgs.id = ins.stock_id
  RETURNING lgs.id AS stock_id, ins.assignment_id AS assignment_id;
$$;

COMMENT ON FUNCTION public.dispatch_lead_generation_stock_claim(
  uuid, integer, integer, uuid, text, text, text, text, text, boolean, uuid
) IS
  'Sélection ready_now (SKIP LOCKED) ; refuse si volume opérationnel agent ≥ 120.';

GRANT EXECUTE ON FUNCTION public.dispatch_lead_generation_stock_claim(
  uuid, integer, integer, uuid, text, text, text, text, text, boolean, uuid
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.dispatch_lead_generation_stock_claim(
  uuid, integer, integer, uuid, text, text, text, text, text, boolean, uuid
) TO service_role;

-- Premium : même règle capacité 120.
DROP FUNCTION IF EXISTS public.dispatch_lead_generation_stock_claim_premium(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.dispatch_lead_generation_stock_claim_premium(
  p_agent_id uuid,
  p_limit integer,
  p_batch_number integer
)
RETURNS TABLE (
  stock_id uuid,
  assignment_id uuid
)
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH agent_volume AS (
    SELECT COALESCE(COUNT(*), 0)::integer AS n
    FROM public.lead_generation_assignments a
    INNER JOIN public.lead_generation_stock s ON s.id = a.stock_id
    WHERE a.agent_id = p_agent_id
      AND a.outcome = 'pending'
      AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
      AND s.converted_lead_id IS NULL
      AND s.stock_status NOT IN ('rejected', 'archived', 'expired')
      AND a.commercial_pipeline_status IN ('new', 'contacted', 'follow_up')
  ),
  picked AS (
    SELECT lgs.id
    FROM public.lead_generation_stock lgs, agent_volume v
    WHERE v.n < 120
      AND lgs.stock_status = 'ready'
      AND lgs.qualification_status = 'qualified'
      AND lgs.phone_status = 'found'
      AND lgs.current_assignment_id IS NULL
      AND lgs.dispatch_queue_status = 'ready_now'
      AND lgs.lead_tier = 'premium'
    ORDER BY lgs.premium_score DESC,
             lgs.commercial_score DESC,
             lgs.dispatch_queue_rank DESC,
             lgs.created_at DESC
    FOR UPDATE OF lgs SKIP LOCKED
    LIMIT greatest(0, coalesce(p_limit, 0))
  ),
  ins AS (
    INSERT INTO public.lead_generation_assignments (
      stock_id,
      agent_id,
      assignment_status,
      outcome,
      batch_number,
      assigned_at
    )
    SELECT
      picked.id,
      p_agent_id,
      'assigned',
      'pending',
      p_batch_number,
      now()
    FROM picked
    RETURNING id AS assignment_id, stock_id AS stock_id
  )
  UPDATE public.lead_generation_stock lgs
  SET
    stock_status = 'assigned',
    current_assignment_id = ins.assignment_id,
    updated_at = now()
  FROM ins
  WHERE lgs.id = ins.stock_id
  RETURNING lgs.id AS stock_id, ins.assignment_id AS assignment_id;
$$;

COMMENT ON FUNCTION public.dispatch_lead_generation_stock_claim_premium(uuid, integer, integer) IS
  'Attribution SKIP LOCKED — fiches premium ; refuse si volume opérationnel agent ≥ 120.';

GRANT EXECUTE ON FUNCTION public.dispatch_lead_generation_stock_claim_premium(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_lead_generation_stock_claim_premium(uuid, integer, integer) TO service_role;
