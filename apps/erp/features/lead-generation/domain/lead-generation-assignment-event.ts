/**
 * Événements du journal pipeline (table `lead_generation_assignment_events`).
 * Les métadonnées libres restent dans `metadata_json`.
 */
export const LEAD_GENERATION_ASSIGNMENT_EVENT_KINDS = [
  "assigned",
  "first_contact",
  "moved_to_contacted",
  "moved_to_follow_up",
  "moved_to_converted",
  "outcome_changed",
  "released_inactive_agent",
  "sla_breached",
  "dispatch_blocked",
  "dispatch_resumed",
] as const;

export type LeadGenerationAssignmentEventKind = (typeof LEAD_GENERATION_ASSIGNMENT_EVENT_KINDS)[number];

export type LeadGenerationAssignmentEventRow = {
  id: string;
  assignment_id: string | null;
  agent_id: string;
  lead_generation_stock_id: string | null;
  event_type: LeadGenerationAssignmentEventKind;
  from_commercial_pipeline_status: string | null;
  to_commercial_pipeline_status: string | null;
  from_outcome: string | null;
  to_outcome: string | null;
  occurred_at: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
};
