-- Étape 16 — recyclage intelligent : suivi sur les assignations

ALTER TABLE public.lead_generation_assignments
  ADD COLUMN IF NOT EXISTS recycle_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS recycle_reason text,
  ADD COLUMN IF NOT EXISTS recycle_eligible_at timestamptz,
  ADD COLUMN IF NOT EXISTS recycled_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_recycled_at timestamptz;

ALTER TABLE public.lead_generation_assignments DROP CONSTRAINT IF EXISTS lead_generation_assignments_recycle_status_check;

ALTER TABLE public.lead_generation_assignments ADD CONSTRAINT lead_generation_assignments_recycle_status_check CHECK (
  recycle_status IN ('active', 'eligible', 'recycled', 'closed')
);

COMMENT ON COLUMN public.lead_generation_assignments.recycle_status IS
  'Cycle recyclage métier : actif, éligible, déjà recyclé, clos (étape 16).';
COMMENT ON COLUMN public.lead_generation_assignments.recycle_reason IS
  'Code stable expliquant l’éligibilité (ex. ASSIGNED_NOT_OPENED_STALE).';
COMMENT ON COLUMN public.lead_generation_assignments.recycle_eligible_at IS
  'Horodatage du dernier calcul ayant marqué l’assignation comme éligible.';

CREATE INDEX IF NOT EXISTS idx_lead_gen_assignments_recycle_status
  ON public.lead_generation_assignments (recycle_status);

CREATE INDEX IF NOT EXISTS idx_lead_gen_assignments_recycle_eligible_at
  ON public.lead_generation_assignments (recycle_eligible_at);

CREATE INDEX IF NOT EXISTS idx_lead_gen_assignments_agent_recycle
  ON public.lead_generation_assignments (agent_id, recycle_status);

-- Aligner les lignes déjà terminées côté cycle de vie assignation
UPDATE public.lead_generation_assignments
SET recycle_status = 'recycled'
WHERE assignment_status = 'recycled'
  AND recycle_status = 'active';

UPDATE public.lead_generation_assignments
SET recycle_status = 'closed'
WHERE assignment_status IN ('consumed', 'expired')
  AND recycle_status = 'active';

UPDATE public.lead_generation_assignments
SET recycle_status = 'closed'
WHERE created_lead_id IS NOT NULL
  AND recycle_status = 'active';

UPDATE public.lead_generation_assignments
SET recycle_status = 'closed'
WHERE outcome IS NOT NULL
  AND outcome <> 'pending'
  AND recycle_status = 'active';
