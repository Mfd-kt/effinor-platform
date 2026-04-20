-- Journal d’événements pipeline commercial (lead generation) pour KPI temporels et audits.

CREATE TABLE public.lead_generation_assignment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.lead_generation_assignments (id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  lead_generation_stock_id uuid REFERENCES public.lead_generation_stock (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_commercial_pipeline_status text,
  to_commercial_pipeline_status text,
  from_outcome text,
  to_outcome text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_generation_assignment_events_type_check CHECK (
    event_type IN (
      'assigned',
      'first_contact',
      'moved_to_contacted',
      'moved_to_follow_up',
      'moved_to_converted',
      'outcome_changed',
      'sla_breached',
      'dispatch_blocked',
      'dispatch_resumed'
    )
  ),
  CONSTRAINT lead_generation_assignment_events_scope_check CHECK (
    (
      event_type IN ('dispatch_blocked', 'dispatch_resumed')
      AND assignment_id IS NULL
      AND lead_generation_stock_id IS NULL
    )
    OR (
      assignment_id IS NOT NULL
      AND lead_generation_stock_id IS NOT NULL
    )
  )
);

COMMENT ON TABLE public.lead_generation_assignment_events IS
  'Historique des transitions et actions pipeline (assignation, SLA, dispatch, conversion).';

CREATE INDEX idx_lg_assignment_events_assignment ON public.lead_generation_assignment_events (assignment_id);
CREATE INDEX idx_lg_assignment_events_agent_occurred ON public.lead_generation_assignment_events (agent_id, occurred_at DESC);
CREATE INDEX idx_lg_assignment_events_type_occurred ON public.lead_generation_assignment_events (event_type, occurred_at DESC);
CREATE INDEX idx_lg_assignment_events_stock ON public.lead_generation_assignment_events (lead_generation_stock_id);

-- Dédup évidents : une seule fois « assigned » et « first_contact » par assignation.
CREATE UNIQUE INDEX uq_lg_assignment_events_assigned
  ON public.lead_generation_assignment_events (assignment_id)
  WHERE event_type = 'assigned';

CREATE UNIQUE INDEX uq_lg_assignment_events_first_contact
  ON public.lead_generation_assignment_events (assignment_id)
  WHERE event_type = 'first_contact';

CREATE UNIQUE INDEX uq_lg_assignment_events_converted
  ON public.lead_generation_assignment_events (assignment_id)
  WHERE event_type = 'moved_to_converted';

ALTER TABLE public.lead_generation_assignment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_generation_assignment_events_all_active"
  ON public.lead_generation_assignment_events
  FOR ALL
  TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

-- Vue matérialisante les jalons pour futurs KPI (temps assignation → premier contact, etc.).
CREATE OR REPLACE VIEW public.lead_generation_assignment_event_milestones AS
SELECT
  a.id AS assignment_id,
  a.agent_id,
  a.stock_id AS lead_generation_stock_id,
  (
    SELECT min(e.occurred_at)
    FROM public.lead_generation_assignment_events e
    WHERE e.assignment_id = a.id
      AND e.event_type = 'assigned'
  ) AS assigned_event_at,
  (
    SELECT min(e.occurred_at)
    FROM public.lead_generation_assignment_events e
    WHERE e.assignment_id = a.id
      AND e.event_type = 'first_contact'
  ) AS first_contact_event_at,
  (
    SELECT min(e.occurred_at)
    FROM public.lead_generation_assignment_events e
    WHERE e.assignment_id = a.id
      AND e.event_type = 'moved_to_converted'
  ) AS converted_event_at
FROM public.lead_generation_assignments a;

COMMENT ON VIEW public.lead_generation_assignment_event_milestones IS
  'Agrégation des dates clés par assignation (alimente KPI délais).';
