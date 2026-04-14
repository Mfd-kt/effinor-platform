-- Statut « perdu » : clôture sans conversion, masqué des onglets actifs (terminal).

ALTER TABLE public.commercial_callbacks DROP CONSTRAINT IF EXISTS commercial_callbacks_status_check;
ALTER TABLE public.commercial_callbacks
  ADD CONSTRAINT commercial_callbacks_status_check CHECK (
    status IN (
      'pending',
      'due_today',
      'overdue',
      'in_progress',
      'completed',
      'no_answer',
      'rescheduled',
      'cancelled',
      'converted_to_lead',
      'cold_followup',
      'lost'
    )
  );
