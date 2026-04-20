import type { SupabaseClient } from "@supabase/supabase-js";

import type { CommercialPipelineStatus } from "../domain/commercial-pipeline-status";
import type { CommercialSlaStatus } from "../domain/commercial-pipeline-sla";
import { computeCommercialSlaFields } from "../lib/compute-commercial-sla";
import { lgTable } from "../lib/lg-db";

import { notifyLeadGenerationCommercialSlaBreach } from "./notify-lead-generation-commercial-sla-breach";
import { recordLeadGenerationAssignmentEvent } from "./record-lead-generation-assignment-event";

async function loadEarliestNextActionAt(
  supabase: SupabaseClient,
  assignmentId: string,
): Promise<string | null> {
  const t = lgTable(supabase, "lead_generation_assignment_activities");
  const { data, error } = await t
    .select("next_action_at")
    .eq("assignment_id", assignmentId)
    .not("next_action_at", "is", null)
    .order("next_action_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Relance SLA : ${error.message}`);
  }
  const row = data as { next_action_at: string } | null;
  return row?.next_action_at?.trim() || null;
}

/**
 * Recalcule et persiste le SLA pour une assignation ; notifie Slack si passage en breached.
 */
export async function refreshLeadGenerationAssignmentSla(
  supabase: SupabaseClient,
  assignmentId: string,
  options?: { now?: Date; notifyOnBreach?: boolean },
): Promise<void> {
  const now = options?.now ?? new Date();
  const notifyOnBreach = options?.notifyOnBreach !== false;

  const assignments = lgTable(supabase, "lead_generation_assignments");
  const { data: row, error: aErr } = await assignments
    .select(
      "id, stock_id, agent_id, outcome, assigned_at, last_activity_at, commercial_pipeline_status, sla_status",
    )
    .eq("id", assignmentId)
    .maybeSingle();

  if (aErr) {
    throw new Error(`SLA assignation : ${aErr.message}`);
  }
  if (!row) {
    return;
  }

  const r = row as {
    id: string;
    stock_id: string;
    agent_id: string;
    outcome: string;
    assigned_at: string | null;
    last_activity_at: string | null;
    commercial_pipeline_status: string | null;
    sla_status: string | null;
  };

  let companyName = "—";
  const stockTable = lgTable(supabase, "lead_generation_stock");
  const { data: stockRow } = await stockTable.select("company_name").eq("id", r.stock_id).maybeSingle();
  companyName = ((stockRow as { company_name: string | null } | null)?.company_name ?? "").trim() || "—";

  let agentDisplayName = r.agent_id.slice(0, 8);
  const { data: profileRow } = await supabase.from("profiles").select("full_name, email").eq("id", r.agent_id).maybeSingle();
  if (profileRow) {
    const p = profileRow as { full_name: string | null; email: string | null };
    agentDisplayName = p.full_name?.trim() || p.email?.trim() || agentDisplayName;
  }

  const nearestNext = await loadEarliestNextActionAt(supabase, assignmentId);

  const pipeline = (r.commercial_pipeline_status ?? "new") as CommercialPipelineStatus;
  const computed = computeCommercialSlaFields({
    now,
    commercialPipelineStatus: pipeline,
    outcome: r.outcome,
    assignedAt: r.assigned_at,
    lastActivityAt: r.last_activity_at,
    nearestNextActionAt: nearestNext,
  });

  const previousSla = (r.sla_status ?? null) as CommercialSlaStatus | null;
  const nextSla = computed.slaStatus;

  const patch: Record<string, unknown> = {
    sla_due_at: computed.slaDueAt,
    sla_window_start_at: computed.slaWindowStartAt,
    sla_status: nextSla,
    updated_at: now.toISOString(),
  };

  const { error: upErr } = await assignments.update(patch).eq("id", assignmentId);
  if (upErr) {
    throw new Error(`Mise à jour SLA : ${upErr.message}`);
  }

  const breachedNow = nextSla === "breached";
  const wasBreached = previousSla === "breached";
  if (notifyOnBreach && breachedNow && !wasBreached) {
    await notifyLeadGenerationCommercialSlaBreach({
      assignmentId: r.id,
      stockId: r.stock_id,
      companyName,
      agentDisplayName,
      commercialPipelineStatus: pipeline,
    });
    await recordLeadGenerationAssignmentEvent(supabase, {
      eventType: "sla_breached",
      assignmentId: r.id,
      agentId: r.agent_id,
      leadGenerationStockId: r.stock_id,
      fromCommercialPipelineStatus: pipeline,
      toCommercialPipelineStatus: pipeline,
      fromOutcome: r.outcome,
      toOutcome: r.outcome,
      occurredAt: now.toISOString(),
      metadataJson: {
        source: "refresh_lead_generation_assignment_sla",
        previous_sla_status: previousSla,
        next_sla_status: nextSla,
        sla_due_at: computed.slaDueAt,
      },
    });
  }
}
