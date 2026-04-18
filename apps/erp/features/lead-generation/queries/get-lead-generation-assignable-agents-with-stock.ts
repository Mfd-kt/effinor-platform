import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

import { getLeadGenerationAssignableAgents, type LeadGenerationAssignableAgent } from "./get-lead-generation-assignable-agents";

const ACTIVE_STATUSES = ["assigned", "opened", "in_progress"] as const;

export type LeadGenerationAssignableAgentWithStock = LeadGenerationAssignableAgent & {
  activeStock: number;
};

/**
 * Commerciaux assignables avec nombre de fiches actives en portefeuille
 * (assignments `assigned` | `opened` | `in_progress`, outcome `pending`).
 */
export async function getLeadGenerationAssignableAgentsWithStock(): Promise<LeadGenerationAssignableAgentWithStock[]> {
  const agents = await getLeadGenerationAssignableAgents();
  if (agents.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const t = lgTable(supabase, "lead_generation_assignments");
  const ids = agents.map((a) => a.id);

  const { data, error } = await t
    .select("agent_id")
    .in("agent_id", ids)
    .in("assignment_status", [...ACTIVE_STATUSES])
    .eq("outcome", "pending");

  if (error) {
    throw new Error(`Stock actif agents lead-generation : ${error.message}`);
  }

  const counts = new Map<string, number>();
  for (const id of ids) {
    counts.set(id, 0);
  }
  for (const row of data ?? []) {
    const aid = (row as { agent_id: string }).agent_id;
    counts.set(aid, (counts.get(aid) ?? 0) + 1);
  }

  return agents.map((a) => ({
    ...a,
    activeStock: counts.get(a.id) ?? 0,
  }));
}
