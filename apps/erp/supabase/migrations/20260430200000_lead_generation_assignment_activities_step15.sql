-- Étape 15 — journal d’activité commerciale sur les assignations (avant conversion lead)

CREATE TABLE public.lead_generation_assignment_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.lead_generation_assignments (id) ON DELETE CASCADE,
  stock_id uuid NOT NULL REFERENCES public.lead_generation_stock (id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_label text NOT NULL,
  activity_notes text,
  outcome text,
  next_action_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_generation_assignment_activities_activity_type_check CHECK (
    activity_type IN ('call', 'email', 'note', 'status_update', 'follow_up')
  )
);

COMMENT ON TABLE public.lead_generation_assignment_activities IS
  'Journal d’interactions commerciales sur une assignation (traçabilité avant conversion lead).';

CREATE INDEX idx_lead_gen_assignment_activities_assignment_id
  ON public.lead_generation_assignment_activities (assignment_id);

CREATE INDEX idx_lead_gen_assignment_activities_stock_id
  ON public.lead_generation_assignment_activities (stock_id);

CREATE INDEX idx_lead_gen_assignment_activities_agent_id
  ON public.lead_generation_assignment_activities (agent_id);

CREATE INDEX idx_lead_gen_assignment_activities_activity_type
  ON public.lead_generation_assignment_activities (activity_type);

CREATE INDEX idx_lead_gen_assignment_activities_created_at_desc
  ON public.lead_generation_assignment_activities (created_at DESC);

ALTER TABLE public.lead_generation_assignment_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_generation_assignment_activities_all_active"
  ON public.lead_generation_assignment_activities
  FOR ALL
  TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

DROP TRIGGER IF EXISTS set_lead_generation_assignment_activities_updated_at
  ON public.lead_generation_assignment_activities;

CREATE TRIGGER set_lead_generation_assignment_activities_updated_at
  BEFORE UPDATE ON public.lead_generation_assignment_activities
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();
