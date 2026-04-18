import { createClient } from "@/lib/supabase/server";

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
 */
export async function getAgentStockSummary(agentId: string): Promise<AgentStockSummary> {
  const supabase = await createClient();
  /** Tables lead_generation_* hors `Database` généré : chaînage PostgREST inchangé à l’exécution. */
  const a = () => lgTable(supabase, "lead_generation_assignments") as any;

  const [rAssigned, rActive, rConsumed, rConverted, rRejected] = await Promise.all([
    a().eq("agent_id", agentId).select("*", { count: "exact", head: true }),
    a()
      .eq("agent_id", agentId)
      .in("assignment_status", [...ACTIVE_STATUSES])
      .eq("outcome", "pending")
      .select("*", { count: "exact", head: true }),
    a().eq("agent_id", agentId).neq("outcome", "pending").select("*", { count: "exact", head: true }),
    a().eq("agent_id", agentId).eq("outcome", "converted_to_lead").select("*", { count: "exact", head: true }),
    a().eq("agent_id", agentId).in("outcome", [...REJECTED_OUTCOMES]).select("*", { count: "exact", head: true }),
  ]);

  for (const r of [rAssigned, rActive, rConsumed, rConverted, rRejected]) {
    if (r.error) {
      throw new Error(`Synthèse stock agent : ${r.error.message}`);
    }
  }

  return {
    agentId,
    totalAssigned: rAssigned.count ?? 0,
    totalActive: rActive.count ?? 0,
    totalConsumed: rConsumed.count ?? 0,
    totalConverted: rConverted.count ?? 0,
    totalRejected: rRejected.count ?? 0,
  };
}
