import type { SupabaseClient } from "@supabase/supabase-js";

import type { CommercialPipelineStatus } from "../domain/commercial-pipeline-status";
import { recordLeadGenerationAssignmentEvent } from "./record-lead-generation-assignment-event";

/**
 * Journalise conversion lead-generation → lead CRM (RPC) : pipeline + outcome.
 */
export async function recordLeadGenerationConversionJournalEvents(
  supabase: SupabaseClient,
  input: {
    assignmentId: string;
    agentId: string;
    stockId: string;
    beforePipeline: CommercialPipelineStatus;
    beforeOutcome: string;
    afterPipeline: CommercialPipelineStatus;
    afterOutcome: string;
    rpcName: "convert_lead_generation_assignment_to_lead" | "finalize_lead_generation_conversion_with_existing_lead";
    leadId?: string | null;
  },
): Promise<void> {
  const occurredAt = new Date().toISOString();
  const meta = {
    source: input.rpcName,
    lead_id: input.leadId ?? null,
  };

  const inserted = await recordLeadGenerationAssignmentEvent(supabase, {
    eventType: "moved_to_converted",
    assignmentId: input.assignmentId,
    agentId: input.agentId,
    leadGenerationStockId: input.stockId,
    fromCommercialPipelineStatus: input.beforePipeline,
    toCommercialPipelineStatus: input.afterPipeline,
    fromOutcome: input.beforeOutcome,
    toOutcome: input.afterOutcome,
    occurredAt,
    metadataJson: meta,
  });

  if (!inserted) {
    return;
  }

  if (input.beforeOutcome !== input.afterOutcome) {
    await recordLeadGenerationAssignmentEvent(supabase, {
      eventType: "outcome_changed",
      assignmentId: input.assignmentId,
      agentId: input.agentId,
      leadGenerationStockId: input.stockId,
      fromCommercialPipelineStatus: input.afterPipeline,
      toCommercialPipelineStatus: input.afterPipeline,
      fromOutcome: input.beforeOutcome,
      toOutcome: input.afterOutcome,
      occurredAt,
      metadataJson: { ...meta, reason: "conversion_rpc" },
    });
  }
}
