import { createClient } from "@/lib/supabase/server";

import { COMMERCIAL_PIPELINE_ACTIVE_STOCK_STATUS } from "../domain/commercial-pipeline-status";
import type { AgentStockSummary } from "../domain/agent-stock-summary";
import { lgTable } from "../lib/lg-db";

const ACTIVE_STATUSES = ["assigned", "opened", "in_progress"] as const;

const REJECTED_OUTCOMES = [
  "out_of_target",
  "cancelled",
  "invalid_data",
  "duplicate",
  "no_answer_exhausted",
] as const;

/**
 * Résumé des assignments d’un agent (compteurs selon les définitions métier).
 * `totalActive` = uniquement pipeline `new` (stock neuf / plafond).
 */
export async function getAgentStockSummary(agentId: string): Promise<AgentStockSummary> {
  const supabase = await createClient();
  const a = () => lgTable(supabase, "lead_generation_assignments") as any;

  const [rAssigned, rFresh, rContacted, rFollowUp, rConsumed, rConverted, rRejected] = await Promise.all([
    a().eq("agent_id", agentId).select("*", { count: "exact", head: true }),
    a()
      .eq("agent_id", agentId)
      .in("assignment_status", [...ACTIVE_STATUSES])
      .eq("outcome", "pending")
      .eq("commercial_pipeline_status", COMMERCIAL_PIPELINE_ACTIVE_STOCK_STATUS)
      .select("*", { count: "exact", head: true }),
    a()
      .eq("agent_id", agentId)
      .in("assignment_status", [...ACTIVE_STATUSES])
      .eq("outcome", "pending")
      .eq("commercial_pipeline_status", "contacted")
      .select("*", { count: "exact", head: true }),
    a()
      .eq("agent_id", agentId)
      .in("assignment_status", [...ACTIVE_STATUSES])
      .eq("outcome", "pending")
      .eq("commercial_pipeline_status", "follow_up")
      .select("*", { count: "exact", head: true }),
    a().eq("agent_id", agentId).neq("outcome", "pending").select("*", { count: "exact", head: true }),
    a().eq("agent_id", agentId).eq("outcome", "converted_to_lead").select("*", { count: "exact", head: true }),
    a().eq("agent_id", agentId).in("outcome", [...REJECTED_OUTCOMES]).select("*", { count: "exact", head: true }),
  ]);

  for (const r of [rAssigned, rFresh, rContacted, rFollowUp, rConsumed, rConverted, rRejected]) {
    if (r.error) {
      throw new Error(`Synthèse stock agent : ${r.error.message}`);
    }
  }

  return {
    agentId,
    totalAssigned: rAssigned.count ?? 0,
    totalActive: rFresh.count ?? 0,
    totalContacted: rContacted.count ?? 0,
    totalFollowUp: rFollowUp.count ?? 0,
    totalConsumed: rConsumed.count ?? 0,
    totalConverted: rConverted.count ?? 0,
    totalRejected: rRejected.count ?? 0,
  };
}
