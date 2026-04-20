import type { SupabaseClient } from "@supabase/supabase-js";

import type { CommercialPipelineStatus } from "../domain/commercial-pipeline-status";
import { recordLeadGenerationAssignmentEvent } from "../services/record-lead-generation-assignment-event";

/**
 * Enregistre les événements métier liés à un changement de pipeline / outcome après une action commerciale.
 */
export async function emitLeadGenerationPipelineEventsAfterActivity(input: {
  supabase: SupabaseClient;
  assignmentId: string;
  stockId: string;
  agentId: string;
  previousPipeline: CommercialPipelineStatus;
  nextPipeline: CommercialPipelineStatus;
  fromOutcome: string;
  toOutcome: string;
  occurredAtIso: string;
  /** Contexte léger (type d’activité, libellé). */
  activityContext?: { activityType?: string; activityLabel?: string };
}): Promise<void> {
  const {
    supabase,
    assignmentId,
    stockId,
    agentId,
    previousPipeline,
    nextPipeline,
    fromOutcome,
    toOutcome,
    occurredAtIso,
    activityContext,
  } = input;

  const meta = {
    source: "assignment_activity",
    ...activityContext,
  } satisfies Record<string, unknown>;

  if (previousPipeline === "new" && nextPipeline !== "new") {
    await recordLeadGenerationAssignmentEvent(supabase, {
      eventType: "first_contact",
      assignmentId,
      agentId,
      leadGenerationStockId: stockId,
      fromCommercialPipelineStatus: previousPipeline,
      toCommercialPipelineStatus: nextPipeline,
      fromOutcome,
      toOutcome,
      occurredAt: occurredAtIso,
      metadataJson: meta,
    });
  }

  if (nextPipeline === "contacted" && previousPipeline !== "contacted") {
    await recordLeadGenerationAssignmentEvent(supabase, {
      eventType: "moved_to_contacted",
      assignmentId,
      agentId,
      leadGenerationStockId: stockId,
      fromCommercialPipelineStatus: previousPipeline,
      toCommercialPipelineStatus: nextPipeline,
      fromOutcome,
      toOutcome,
      occurredAt: occurredAtIso,
      metadataJson: meta,
    });
  }

  if (nextPipeline === "follow_up" && previousPipeline !== "follow_up") {
    await recordLeadGenerationAssignmentEvent(supabase, {
      eventType: "moved_to_follow_up",
      assignmentId,
      agentId,
      leadGenerationStockId: stockId,
      fromCommercialPipelineStatus: previousPipeline,
      toCommercialPipelineStatus: nextPipeline,
      fromOutcome,
      toOutcome,
      occurredAt: occurredAtIso,
      metadataJson: meta,
    });
  }

  if (fromOutcome !== toOutcome) {
    await recordLeadGenerationAssignmentEvent(supabase, {
      eventType: "outcome_changed",
      assignmentId,
      agentId,
      leadGenerationStockId: stockId,
      fromCommercialPipelineStatus: nextPipeline,
      toCommercialPipelineStatus: nextPipeline,
      fromOutcome,
      toOutcome,
      occurredAt: occurredAtIso,
      metadataJson: { ...meta, reason: "assignment_outcome" },
    });
  }
}
