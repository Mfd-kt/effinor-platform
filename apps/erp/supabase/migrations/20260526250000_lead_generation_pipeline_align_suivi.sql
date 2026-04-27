-- Aligner le pipeline commercial sur l’activité déjà enregistrée, pour que « En suivi » (cockpit, capacité, filtres)
-- reflète le travail en cours (contacté, à rappeler) au lieu de tout laisser en `new`.

-- 1) Rappel planifié sur au moins une activité -> follow_up
UPDATE public.lead_generation_assignments a
SET
  commercial_pipeline_status = 'follow_up',
  updated_at = now()
WHERE a.outcome = 'pending'
  AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
  AND a.commercial_pipeline_status = 'new'
  AND EXISTS (
    SELECT 1
    FROM public.lead_generation_assignment_activities act
    WHERE act.assignment_id = a.id
      AND act.next_action_at IS NOT NULL
  );

-- 2) Rappel demandé (issue métier) sur la dernière activité, sans changement d’issue plus récente bloquant
UPDATE public.lead_generation_assignments a
SET
  commercial_pipeline_status = 'follow_up',
  updated_at = now()
WHERE a.outcome = 'pending'
  AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
  AND a.commercial_pipeline_status = 'new'
  AND EXISTS (
    SELECT 1
    FROM public.lead_generation_assignment_activities act
    WHERE act.assignment_id = a.id
      AND act.outcome = 'called_callback_requested'
  );

-- 3) Déjà de l’activité, mais statut resté new -> au minimum contacté
UPDATE public.lead_generation_assignments a
SET
  commercial_pipeline_status = 'contacted',
  updated_at = now()
WHERE a.outcome = 'pending'
  AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
  AND a.commercial_pipeline_status = 'new'
  AND a.last_activity_at IS NOT NULL;
