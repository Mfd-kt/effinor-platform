-- Ajoute l'événement de traçabilité pour libération de portefeuille agent inactif.

ALTER TABLE public.lead_generation_assignment_events
  DROP CONSTRAINT IF EXISTS lead_generation_assignment_events_type_check;

ALTER TABLE public.lead_generation_assignment_events
  ADD CONSTRAINT lead_generation_assignment_events_type_check CHECK (
    event_type IN (
      'assigned',
      'first_contact',
      'moved_to_contacted',
      'moved_to_follow_up',
      'moved_to_converted',
      'outcome_changed',
      'released_inactive_agent',
      'sla_breached',
      'dispatch_blocked',
      'dispatch_resumed'
    )
  );

COMMENT ON CONSTRAINT lead_generation_assignment_events_type_check ON public.lead_generation_assignment_events IS
  'Types d''événements pipeline autorisés, incluant la libération automatique d''agent inactif.';

