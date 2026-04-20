import type { SupabaseClient } from "@supabase/supabase-js";

import { lgTable } from "./lg-db";
import { recordLeadGenerationAssignmentEvent } from "../services/record-lead-generation-assignment-event";

type ClaimRow = { stock_id: string; assignment_id: string };

export async function recordLeadGenerationDispatchAssignedEvents(
  supabase: SupabaseClient,
  agentId: string,
  rows: ClaimRow[],
): Promise<void> {
  const iso = new Date().toISOString();
  for (const r of rows) {
    await recordLeadGenerationAssignmentEvent(supabase, {
      eventType: "assigned",
      assignmentId: r.assignment_id,
      agentId,
      leadGenerationStockId: r.stock_id,
      fromCommercialPipelineStatus: null,
      toCommercialPipelineStatus: "new",
      fromOutcome: null,
      toOutcome: "pending",
      occurredAt: iso,
      metadataJson: { source: "dispatch_lead_generation_stock_claim" },
    });
  }
}

export async function recordLeadGenerationDispatchBlockedEvent(
  supabase: SupabaseClient,
  agentId: string,
  reason: string | null,
): Promise<void> {
  await recordLeadGenerationAssignmentEvent(supabase, {
    eventType: "dispatch_blocked",
    assignmentId: null,
    agentId,
    leadGenerationStockId: null,
    fromCommercialPipelineStatus: null,
    toCommercialPipelineStatus: null,
    fromOutcome: null,
    toOutcome: null,
    occurredAt: new Date().toISOString(),
    metadataJson: { reason: reason ?? "unknown" },
  });
}

/**
 * Une injection réussie après un `dispatch_blocked` encore « ouvert » (pas de resume après ce bloc).
 */
export async function maybeRecordLeadGenerationDispatchResumed(
  supabase: SupabaseClient,
  agentId: string,
  assignedCount: number,
): Promise<void> {
  if (assignedCount <= 0) {
    return;
  }

  const t = lgTable(supabase, "lead_generation_assignment_events");

  const { data: blockRows, error: bErr } = await t
    .select("occurred_at")
    .eq("agent_id", agentId)
    .eq("event_type", "dispatch_blocked")
    .order("occurred_at", { ascending: false })
    .limit(1);

  if (bErr || !blockRows?.length) {
    return;
  }

  const blockAt = (blockRows[0] as { occurred_at: string }).occurred_at;

  const { data: resumeRows, error: rErr } = await t
    .select("occurred_at")
    .eq("agent_id", agentId)
    .eq("event_type", "dispatch_resumed")
    .gt("occurred_at", blockAt)
    .order("occurred_at", { ascending: false })
    .limit(1);

  if (!rErr && resumeRows?.length) {
    return;
  }

  await recordLeadGenerationAssignmentEvent(supabase, {
    eventType: "dispatch_resumed",
    assignmentId: null,
    agentId,
    leadGenerationStockId: null,
    fromCommercialPipelineStatus: null,
    toCommercialPipelineStatus: null,
    fromOutcome: null,
    toOutcome: null,
    occurredAt: new Date().toISOString(),
    metadataJson: {
      source: "dispatch",
      after_dispatch_blocked_at: blockAt,
      assigned_count: assignedCount,
    },
  });
}
