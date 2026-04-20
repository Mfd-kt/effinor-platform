-- Pipeline commercial sur assignations : stock « actif » = uniquement commercial_pipeline_status = 'new'.

ALTER TABLE public.lead_generation_assignments
  ADD COLUMN IF NOT EXISTS commercial_pipeline_status text NOT NULL DEFAULT 'new';

ALTER TABLE public.lead_generation_assignments
  DROP CONSTRAINT IF EXISTS lead_generation_assignments_commercial_pipeline_status_check;

ALTER TABLE public.lead_generation_assignments
  ADD CONSTRAINT lead_generation_assignments_commercial_pipeline_status_check CHECK (
    commercial_pipeline_status IN ('new', 'contacted', 'follow_up', 'converted')
  );

COMMENT ON COLUMN public.lead_generation_assignments.commercial_pipeline_status IS
  'new = stock neuf à traiter (seul compté pour plafond / réinjection) ; contacted / follow_up = sortis du stock neuf ; converted = conversion lead.';

CREATE INDEX IF NOT EXISTS idx_lead_generation_assignments_agent_pipeline_new
  ON public.lead_generation_assignments (agent_id, commercial_pipeline_status)
  WHERE outcome = 'pending'
    AND assignment_status IN ('assigned', 'opened', 'in_progress');

-- Backfill : convertis
UPDATE public.lead_generation_assignments
SET commercial_pipeline_status = 'converted'
WHERE created_lead_id IS NOT NULL OR outcome = 'converted_to_lead';

-- Relances planifiées
UPDATE public.lead_generation_assignments a
SET commercial_pipeline_status = 'follow_up'
WHERE a.outcome = 'pending'
  AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
  AND a.commercial_pipeline_status = 'new'
  AND EXISTS (
    SELECT 1
    FROM public.lead_generation_assignment_activities act
    WHERE act.assignment_id = a.id
      AND act.next_action_at IS NOT NULL
  );

-- Déjà travaillé (sans relance future enregistrée — reste contacted)
UPDATE public.lead_generation_assignments a
SET commercial_pipeline_status = 'contacted'
WHERE a.outcome = 'pending'
  AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
  AND a.commercial_pipeline_status = 'new'
  AND (
    a.attempt_count > 0
    OR a.opened_at IS NOT NULL
    OR a.last_activity_at IS NOT NULL
    OR EXISTS (SELECT 1 FROM public.lead_generation_assignment_activities act WHERE act.assignment_id = a.id)
  );
