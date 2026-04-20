import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeadGenerationAssignmentEventKind } from "../domain/lead-generation-assignment-event";
import { lgTable } from "../lib/lg-db";

const PG_UNIQUE_VIOLATION = "23505";

export type RecordLeadGenerationAssignmentEventInput = {
  eventType: LeadGenerationAssignmentEventKind;
  /** Obligatoire sauf `dispatch_blocked` / `dispatch_resumed`. */
  assignmentId: string | null;
  agentId: string;
  /** Obligatoire si `assignmentId` est renseigné. */
  leadGenerationStockId: string | null;
  fromCommercialPipelineStatus?: string | null;
  toCommercialPipelineStatus?: string | null;
  fromOutcome?: string | null;
  toOutcome?: string | null;
  occurredAt?: string;
  metadataJson?: Record<string, unknown>;
};

function isAgentScopedEvent(t: LeadGenerationAssignmentEventKind): boolean {
  return t === "dispatch_blocked" || t === "dispatch_resumed";
}

/**
 * Insère un événement pipeline. Ignore silencieusement les doublons couverts par les index uniques
 * (`assigned`, `first_contact`, `moved_to_converted`).
 * @returns `true` si une ligne a été insérée.
 */
export async function recordLeadGenerationAssignmentEvent(
  supabase: SupabaseClient,
  input: RecordLeadGenerationAssignmentEventInput,
): Promise<boolean> {
  const scoped = isAgentScopedEvent(input.eventType);
  if (!scoped) {
    if (!input.assignmentId?.trim() || !input.leadGenerationStockId?.trim()) {
      throw new Error("Événement assignation : assignment_id et stock_id requis.");
    }
  } else {
    if (input.assignmentId || input.leadGenerationStockId) {
      throw new Error("Événements dispatch : assignment_id et stock_id doivent être null.");
    }
  }

  const t = lgTable(supabase, "lead_generation_assignment_events");
  const { error } = await t.insert({
    assignment_id: input.assignmentId,
    agent_id: input.agentId,
    lead_generation_stock_id: input.leadGenerationStockId,
    event_type: input.eventType,
    from_commercial_pipeline_status: input.fromCommercialPipelineStatus ?? null,
    to_commercial_pipeline_status: input.toCommercialPipelineStatus ?? null,
    from_outcome: input.fromOutcome ?? null,
    to_outcome: input.toOutcome ?? null,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
    metadata_json: input.metadataJson ?? {},
  });

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      return false;
    }
    throw new Error(`Journal pipeline : ${error.message}`);
  }
  return true;
}
