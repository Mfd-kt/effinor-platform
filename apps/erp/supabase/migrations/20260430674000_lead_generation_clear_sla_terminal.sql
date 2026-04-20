-- Nettoyer les champs SLA pour les sorties de flux (cohérence avec pipeline converti / terminé).

UPDATE public.lead_generation_assignments
SET
  sla_due_at = NULL,
  sla_window_start_at = NULL,
  sla_status = NULL
WHERE commercial_pipeline_status = 'converted'
  OR outcome <> 'pending';
