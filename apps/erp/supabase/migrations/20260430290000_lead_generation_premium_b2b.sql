-- Premium B2B : classification tier, score complémentaire, claim dispatch dédié (sans modifier le flux standard).

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS lead_tier text NOT NULL DEFAULT 'raw',
  ADD COLUMN IF NOT EXISTS premium_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS premium_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS premium_scored_at timestamptz NULL;

ALTER TABLE public.lead_generation_stock
  DROP CONSTRAINT IF EXISTS lead_generation_stock_lead_tier_check;

ALTER TABLE public.lead_generation_stock
  ADD CONSTRAINT lead_generation_stock_lead_tier_check
  CHECK (lead_tier IN ('raw', 'workable', 'premium'));

CREATE INDEX IF NOT EXISTS lead_generation_stock_lead_tier_idx
  ON public.lead_generation_stock (lead_tier);

CREATE INDEX IF NOT EXISTS lead_generation_stock_premium_score_desc_idx
  ON public.lead_generation_stock (premium_score DESC);

COMMENT ON COLUMN public.lead_generation_stock.lead_tier IS
  'Classification premium B2B : raw | workable | premium (complémentaire au score commercial).';
COMMENT ON COLUMN public.lead_generation_stock.premium_score IS
  'Score premium 0–100, distinct de commercial_score.';
COMMENT ON COLUMN public.lead_generation_stock.premium_reasons IS
  'Motifs du score premium (JSON array de chaînes).';
COMMENT ON COLUMN public.lead_generation_stock.premium_scored_at IS
  'Horodatage du dernier calcul premium.';

-- Dispatch premium : même garde-fous que le claim standard + lead_tier = premium, tri score premium d’abord.
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
  WITH picked AS (
    SELECT lgs.id
    FROM public.lead_generation_stock lgs
    WHERE lgs.stock_status = 'ready'
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
  'Attribution SKIP LOCKED — uniquement fiches tier premium, file ready_now, mêmes critères de préparation que le claim standard.';

GRANT EXECUTE ON FUNCTION public.dispatch_lead_generation_stock_claim_premium(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_lead_generation_stock_claim_premium(uuid, integer, integer) TO service_role;
