-- =============================================================================
-- Performance : historique d’activités par assignation (page « Ma file »).
-- Index composite pour ORDER BY created_at DESC filtré sur assignment_id.
--
-- Important : ne pas supprimer les colonnes last_call_* sur
-- public.lead_generation_assignments sans refactor complet : elles sont
-- écrites par updateLeadGenerationAssignmentCallTrace et par la RPC
-- close_lead_generation_assignment_from_terminal_call.
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_lead_gen_assignment_activities_assignment_created_desc
  ON public.lead_generation_assignment_activities (assignment_id, created_at DESC);

COMMENT ON INDEX public.idx_lead_gen_assignment_activities_assignment_created_desc IS
  'Accélère la liste des activités d’une assignation (tri récent d’abord).';
