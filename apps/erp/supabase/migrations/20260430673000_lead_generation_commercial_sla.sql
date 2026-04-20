-- SLA opérationnel sur assignations lead generation (pression / pilotage).

ALTER TABLE public.lead_generation_assignments
  ADD COLUMN IF NOT EXISTS sla_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_window_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_status text;

ALTER TABLE public.lead_generation_assignments
  DROP CONSTRAINT IF EXISTS lead_generation_assignments_sla_status_check;

ALTER TABLE public.lead_generation_assignments
  ADD CONSTRAINT lead_generation_assignments_sla_status_check CHECK (
    sla_status IS NULL OR sla_status IN ('on_time', 'warning', 'breached')
  );

COMMENT ON COLUMN public.lead_generation_assignments.sla_due_at IS
  'Échéance SLA courante (selon pipeline : 2h nouveau, 24h contacté, date de relance pour à rappeler).';
COMMENT ON COLUMN public.lead_generation_assignments.sla_window_start_at IS
  'Début de la fenêtre SLA (pour calcul warning <20 % du temps restant).';
COMMENT ON COLUMN public.lead_generation_assignments.sla_status IS
  'on_time | warning | breached — aligné sur l’horloge métier ; null si terminé / converti.';

CREATE INDEX IF NOT EXISTS idx_lead_generation_assignments_agent_sla_breach
  ON public.lead_generation_assignments (agent_id, sla_status)
  WHERE outcome = 'pending'
    AND assignment_status IN ('assigned', 'opened', 'in_progress')
    AND sla_status = 'breached';

CREATE INDEX IF NOT EXISTS idx_lead_generation_assignments_sla_due
  ON public.lead_generation_assignments (sla_due_at)
  WHERE outcome = 'pending'
    AND assignment_status IN ('assigned', 'opened', 'in_progress');
