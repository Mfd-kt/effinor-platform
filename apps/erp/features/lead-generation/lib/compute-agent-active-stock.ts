import type { SupabaseClient } from "@supabase/supabase-js";

import { lgTable } from "./lg-db";

const ACTIVE_STATUSES = ["assigned", "opened", "in_progress"] as const;

export type AgentActiveStockSnapshot = {
  count: number;
};

/**
 * Stock actif pour un agent : assignments encore « en cours » avec outcome pending.
 */
export async function computeAgentActiveStock(
  supabase: SupabaseClient,
  agentId: string,
): Promise<AgentActiveStockSnapshot> {
  const t = lgTable(supabase, "lead_generation_assignments");

  const { count, error } = await t
    .select("*", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .in("assignment_status", [...ACTIVE_STATUSES])
    .eq("outcome", "pending");

  if (error) {
    throw new Error(`Stock actif agent : ${error.message}`);
  }

  return { count: count ?? 0 };
}
