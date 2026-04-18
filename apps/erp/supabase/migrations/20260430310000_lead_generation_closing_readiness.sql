-- Closing readiness + angle d’approche + priorité de rôle décideur + métadonnées d’enrichissement légères.

ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS decision_maker_role_priority text,
  ADD COLUMN IF NOT EXISTS enrichment_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS closing_readiness_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closing_readiness_status text NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS closing_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS closing_scored_at timestamptz,
  ADD COLUMN IF NOT EXISTS approach_angle text,
  ADD COLUMN IF NOT EXISTS approach_hook text;

COMMENT ON COLUMN public.lead_generation_stock.decision_maker_role_priority IS
  'Priorité métier du rôle extrait (ne pas écraser un rôle plus fort par un plus faible).';
COMMENT ON COLUMN public.lead_generation_stock.enrichment_metadata IS
  'JSON léger (ex. linkedin_candidate_reason, trace synchro LinkedIn).';
COMMENT ON COLUMN public.lead_generation_stock.closing_readiness_score IS
  'Score 0–100 orienté exploitabilité commerciale / closing.';
COMMENT ON COLUMN public.lead_generation_stock.closing_readiness_status IS
  'Niveau closing : low | medium | high.';
COMMENT ON COLUMN public.lead_generation_stock.closing_reasons IS
  'Motifs courts du score closing (JSON array de chaînes).';
COMMENT ON COLUMN public.lead_generation_stock.approach_angle IS
  'Angle d’accroche métier suggéré (code court).';
COMMENT ON COLUMN public.lead_generation_stock.approach_hook IS
  'Phrase courte exploitable au téléphone.';

ALTER TABLE public.lead_generation_stock
  DROP CONSTRAINT IF EXISTS lead_generation_stock_decision_maker_role_priority_check;

ALTER TABLE public.lead_generation_stock
  ADD CONSTRAINT lead_generation_stock_decision_maker_role_priority_check CHECK (
    decision_maker_role_priority IS NULL
    OR decision_maker_role_priority IN (
      'owner_executive',
      'site_director',
      'maintenance_manager',
      'technical_manager',
      'energy_manager',
      'general_exec'
    )
  );

ALTER TABLE public.lead_generation_stock
  DROP CONSTRAINT IF EXISTS lead_generation_stock_closing_readiness_status_check;

ALTER TABLE public.lead_generation_stock
  ADD CONSTRAINT lead_generation_stock_closing_readiness_status_check CHECK (
    closing_readiness_status IN ('low', 'medium', 'high')
  );

ALTER TABLE public.lead_generation_stock
  DROP CONSTRAINT IF EXISTS lead_generation_stock_closing_readiness_score_check;

ALTER TABLE public.lead_generation_stock
  ADD CONSTRAINT lead_generation_stock_closing_readiness_score_check CHECK (
    closing_readiness_score >= 0
    AND closing_readiness_score <= 100
  );

CREATE INDEX IF NOT EXISTS lead_generation_stock_closing_status_idx
  ON public.lead_generation_stock (closing_readiness_status);

CREATE INDEX IF NOT EXISTS lead_generation_stock_closing_score_desc_idx
  ON public.lead_generation_stock (closing_readiness_score DESC);

-- Dispatch premium : prioriser les fiches les plus « closing-ready » sans changer les filtres métier.
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
    ORDER BY lgs.closing_readiness_score DESC,
             lgs.premium_score DESC,
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
  'Attribution SKIP LOCKED — tier premium, ready_now, tri closing_readiness puis premium_score.';
