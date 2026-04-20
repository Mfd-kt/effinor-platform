-- Garde-fou : vider les champs SLA quand l’assignation sort du flux actif (converti / outcome terminal).

CREATE OR REPLACE FUNCTION public.lead_generation_assignments_clear_sla_terminal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.commercial_pipeline_status = 'converted' OR (NEW.outcome IS NOT NULL AND NEW.outcome <> 'pending') THEN
    NEW.sla_due_at := NULL;
    NEW.sla_window_start_at := NULL;
    NEW.sla_status := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lead_generation_assignments_clear_sla_terminal ON public.lead_generation_assignments;

CREATE TRIGGER lead_generation_assignments_clear_sla_terminal
  BEFORE INSERT OR UPDATE OF commercial_pipeline_status, outcome
  ON public.lead_generation_assignments
  FOR EACH ROW
  EXECUTE PROCEDURE public.lead_generation_assignments_clear_sla_terminal();
