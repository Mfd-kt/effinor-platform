import { createClient } from "@/lib/supabase/server";

import type { PremiumAutoDispatchLeadsResult } from "../domain/main-actions-result";
import { computeAgentActiveStock } from "../lib/compute-agent-active-stock";
import { lgTable } from "../lib/lg-db";
import type { LeadGenerationAssignableAgent } from "../queries/get-lead-generation-assignable-agents";

type RpcClaimRow = { stock_id: string; assignment_id: string };

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function buildUniqueAgentLabels(agents: LeadGenerationAssignableAgent[]): Map<string, string> {
  const usage = new Map<string, number>();
  const idToLabel = new Map<string, string>();
  for (const a of agents) {
    const base = (a.displayName ?? "").trim() || "Commercial";
    const next = (usage.get(base) ?? 0) + 1;
    usage.set(base, next);
    const label = next === 1 ? base : `${base} (${next})`;
    idToLabel.set(a.id, label);
  }
  return idToLabel;
}

export async function countDispatchablePremiumReadyNowPool(): Promise<number> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const { count, error } = await stock
    .select("*", { count: "exact", head: true })
    .eq("stock_status", "ready")
    .eq("qualification_status", "qualified")
    .eq("phone_status", "found")
    .is("current_assignment_id", null)
    .eq("dispatch_queue_status", "ready_now")
    .eq("lead_tier", "premium");

  if (error) {
    throw new Error(`Comptage file dispatch premium : ${error.message}`);
  }
  return count ?? 0;
}

/**
 * Répartition round-robin des fiches `premium` en `ready_now`, via RPC dédiée (flux séparé du standard).
 */
export async function autoDispatchPremiumLeadGenerationStockRoundRobin(input: {
  agents: LeadGenerationAssignableAgent[];
  maxActiveStockPerAgent: number;
}): Promise<PremiumAutoDispatchLeadsResult> {
  const supabase = await createClient();
  const { agents, maxActiveStockPerAgent } = input;

  if (agents.length === 0) {
    const remainingPremiumLeads = await countDispatchablePremiumReadyNowPool();
    return {
      totalAssigned: 0,
      distributionByAgent: {},
      remainingPremiumLeads,
      agentsConsidered: 0,
    };
  }

  const cap = Math.min(Math.max(1, maxActiveStockPerAgent), 100);

  type AgentState = { agent: LeadGenerationAssignableAgent; need: number };
  const states: AgentState[] = [];
  for (const agent of agents) {
    const { count: active } = await computeAgentActiveStock(supabase, agent.id);
    const need = Math.max(0, cap - active);
    if (need > 0) {
      states.push({ agent, need });
    }
  }

  if (states.length === 0) {
    const remainingPremiumLeads = await countDispatchablePremiumReadyNowPool();
    return {
      totalAssigned: 0,
      distributionByAgent: {},
      remainingPremiumLeads,
      agentsConsidered: agents.length,
    };
  }

  const idToLabel = buildUniqueAgentLabels(agents);
  const assignedById = new Map<string, number>();
  const batchNumber = Math.floor(Date.now() / 1000);

  let rr = 0;
  let totalAssigned = 0;
  const maxIterations = Math.min(8000, states.reduce((s, x) => s + x.need, 0) + 50);

  for (let iter = 0; iter < maxIterations; iter += 1) {
    let pick = -1;
    for (let k = 0; k < states.length; k += 1) {
      const idx = mod(rr + k, states.length);
      if (states[idx].need > 0) {
        pick = idx;
        break;
      }
    }
    if (pick < 0) {
      break;
    }

    const chosen = states[pick];
    const { data, error } = await supabase.rpc("dispatch_lead_generation_stock_claim_premium", {
      p_agent_id: chosen.agent.id,
      p_limit: 1,
      p_batch_number: batchNumber,
    });

    if (error) {
      throw new Error(`Auto-dispatch premium : ${error.message}`);
    }

    const rows = (data ?? []) as RpcClaimRow[];
    if (rows.length === 0) {
      break;
    }

    chosen.need -= 1;
    totalAssigned += 1;
    const aid = chosen.agent.id;
    assignedById.set(aid, (assignedById.get(aid) ?? 0) + 1);
    rr = mod(pick + 1, states.length);
  }

  const distributionByAgent: Record<string, number> = {};
  for (const [agentId, n] of assignedById) {
    if (n <= 0) continue;
    const label = idToLabel.get(agentId) ?? "Commercial";
    distributionByAgent[label] = n;
  }

  const remainingPremiumLeads = await countDispatchablePremiumReadyNowPool();

  return {
    totalAssigned,
    distributionByAgent,
    remainingPremiumLeads,
    agentsConsidered: agents.length,
  };
}
