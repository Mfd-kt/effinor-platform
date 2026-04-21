import { createClient } from "@/lib/supabase/server";

import type { AutoDispatchLeadsResult } from "../domain/main-actions-result";
import {
  applyCommercialCapacityToDispatchNeed,
  computeCommercialCapacityForAgents,
} from "../lib/agent-commercial-capacity";
import { buildDispatchLeadGenerationStockClaimRpcParams } from "../lib/build-dispatch-lead-generation-rpc-params";
import { computeAgentActiveStock, computeAgentActiveStockForCeeSheet } from "../lib/compute-agent-active-stock";
import { lgTable } from "../lib/lg-db";
import { applyLeadGenerationStockFilters } from "../queries/apply-lead-generation-stock-filters";
import type { LeadGenerationAssignableAgent } from "../queries/get-lead-generation-assignable-agents";
import type { GetLeadGenerationStockFilters } from "../queries/get-lead-generation-stock";

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

/** Pool attribuable = ready_now + mêmes critères que la liste (intersection). */
export async function countDispatchableReadyNowPoolWithFilters(
  filters: GetLeadGenerationStockFilters | undefined,
): Promise<number> {
  const supabase = await createClient();
  let effectiveFilters = filters;
  if (filters?.cee_sheet_id?.trim()) {
    const sheetId = filters.cee_sheet_id.trim();
    const { data: batches, error: bErr } = await supabase
      .from("lead_generation_import_batches")
      .select("id")
      .eq("cee_sheet_id", sheetId);
    if (bErr) {
      throw new Error(bErr.message);
    }
    const ids = (batches ?? []).map((b) => b.id as string).filter(Boolean);
    if (ids.length === 0) {
      return 0;
    }
    const rest = { ...filters };
    delete rest.cee_sheet_id;
    delete rest.import_batch_ids;
    effectiveFilters = { ...rest, import_batch_ids: ids };
  }

  const stock = lgTable(supabase, "lead_generation_stock");
  let q = stock.select("*", { count: "exact", head: true });
  q = q
    .eq("stock_status", "ready")
    .eq("qualification_status", "qualified")
    .eq("phone_status", "found")
    .is("current_assignment_id", null)
    .eq("dispatch_queue_status", "ready_now");
  q = applyLeadGenerationStockFilters(q, effectiveFilters);
  const { count, error } = await q;

  if (error) {
    throw new Error(`Comptage file dispatch : ${error.message}`);
  }
  return count ?? 0;
}

export async function countDispatchableReadyNowPool(): Promise<number> {
  return countDispatchableReadyNowPoolWithFilters(undefined);
}

export async function countDispatchableReadyNowPoolForBatch(importBatchId: string): Promise<number> {
  return countDispatchableReadyNowPoolWithFilters({ import_batch_id: importBatchId });
}

function mergeStockFiltersForDispatch(
  stockFilters: GetLeadGenerationStockFilters | null | undefined,
  importBatchId: string | null,
): GetLeadGenerationStockFilters | undefined {
  const f: GetLeadGenerationStockFilters = { ...(stockFilters ?? {}) };
  if (importBatchId) {
    f.import_batch_id = importBatchId;
  }
  return Object.keys(f).length > 0 ? f : undefined;
}

/**
 * Répartit les fiches `ready_now` entre agents actifs en round-robin, sans dépasser le plafond par agent.
 * Utilise la RPC `dispatch_lead_generation_stock_claim` (SKIP LOCKED) pour chaque attribution unitaire.
 */
export async function autoDispatchLeadGenerationStockRoundRobin(input: {
  agents: LeadGenerationAssignableAgent[];
  maxActiveStockPerAgent: number;
  /** Limite les attributions au lot (coordinateur). */
  importBatchId?: string | null;
  /** Filtres liste (ville, source, lot, contact_gap…) — même intersection que le compteur. */
  stockFilters?: GetLeadGenerationStockFilters | null;
  /** Arrête après N attributions réussies sur cette passe (ex. lot UI de 100). */
  maxAssignmentsThisRun?: number | null;
}): Promise<AutoDispatchLeadsResult> {
  const supabase = await createClient();
  const { agents, maxActiveStockPerAgent, importBatchId, stockFilters, maxAssignmentsThisRun } = input;
  const maxThisRun =
    maxAssignmentsThisRun != null && maxAssignmentsThisRun > 0
      ? maxAssignmentsThisRun
      : Number.POSITIVE_INFINITY;
  const lotId = importBatchId?.trim() || null;
  const effectiveFilters = mergeStockFiltersForDispatch(stockFilters, lotId);
  const countRemaining = () => countDispatchableReadyNowPoolWithFilters(effectiveFilters);
  const rpcPayload = buildDispatchLeadGenerationStockClaimRpcParams(effectiveFilters);

  if (agents.length === 0) {
    const remaining_leads = await countRemaining();
    return {
      total_assigned: 0,
      distribution_par_agent: {},
      remaining_leads,
      agents_considered: 0,
    };
  }

  const cap = Math.min(Math.max(1, maxActiveStockPerAgent), 100);

  type AgentState = { agent: LeadGenerationAssignableAgent; need: number; volumeTotal: number };
  const states: AgentState[] = [];
  const ceeForCap = effectiveFilters?.cee_sheet_id?.trim() ?? null;

  const capacityMap = await computeCommercialCapacityForAgents(
    supabase,
    agents.map((a) => a.id),
  );

  for (const agent of agents) {
    const { count: active } = ceeForCap
      ? await computeAgentActiveStockForCeeSheet(supabase, agent.id, ceeForCap)
      : await computeAgentActiveStock(supabase, agent.id);
    const baseNeed = Math.max(0, cap - active);
    const vol = capacityMap.get(agent.id)?.total ?? 0;
    const need = applyCommercialCapacityToDispatchNeed(baseNeed, vol);
    if (need > 0) {
      states.push({ agent, need, volumeTotal: vol });
    }
  }

  if (states.length === 0) {
    const remaining_leads = await countRemaining();
    return {
      total_assigned: 0,
      distribution_par_agent: {},
      remaining_leads,
      agents_considered: agents.length,
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
    const { data, error } = await supabase.rpc("dispatch_lead_generation_stock_claim", {
      p_agent_id: chosen.agent.id,
      p_limit: 1,
      p_batch_number: batchNumber,
      ...rpcPayload,
    });

    if (error) {
      throw new Error(`Auto-dispatch : ${error.message}`);
    }

    const rows = (data ?? []) as RpcClaimRow[];
    if (rows.length === 0) {
      break;
    }

    chosen.need -= 1;
    chosen.volumeTotal += 1;
    const capRemaining = applyCommercialCapacityToDispatchNeed(9_999, chosen.volumeTotal);
    chosen.need = Math.min(chosen.need, capRemaining);
    totalAssigned += 1;
    const aid = chosen.agent.id;
    assignedById.set(aid, (assignedById.get(aid) ?? 0) + 1);
    rr = mod(pick + 1, states.length);
    if (totalAssigned >= maxThisRun) {
      break;
    }
  }

  const distribution_par_agent: Record<string, number> = {};
  for (const [agentId, n] of assignedById) {
    if (n <= 0) continue;
    const label = idToLabel.get(agentId) ?? "Commercial";
    distribution_par_agent[label] = n;
  }

  const remaining_leads = await countRemaining();

  return {
    total_assigned: totalAssigned,
    distribution_par_agent,
    remaining_leads,
    agents_considered: agents.length,
  };
}

const EXHAUST_DISPATCH_MAX_ROUNDS = 150;

/**
 * Enchaîne des passes de distribution jusqu’à ce qu’aucune attribution ne soit plus possible
 * (agents saturés ou pool vide). Utile pour « tout distribuer » d’un clic.
 */
export async function autoDispatchLeadGenerationStockRoundRobinUntilDry(input: {
  agents: LeadGenerationAssignableAgent[];
  maxActiveStockPerAgent: number;
  importBatchId?: string | null;
  stockFilters?: GetLeadGenerationStockFilters | null;
  /** Plafond total d’attributions pour ce clic (plusieurs passes si besoin). */
  maxTotalAssignments?: number | null;
}): Promise<{
  total_assigned: number;
  rounds: number;
  distribution_par_agent: Record<string, number>;
  remaining_leads: number;
  agents_considered: number;
}> {
  const cap = input.maxTotalAssignments ?? Number.POSITIVE_INFINITY;
  const merged = new Map<string, number>();
  let total = 0;
  let rounds = 0;
  let remaining = 0;
  let agentsConsidered = 0;

  for (let r = 0; r < EXHAUST_DISPATCH_MAX_ROUNDS; r++) {
    if (total >= cap) break;
    const budget = Number.isFinite(cap) ? cap - total : undefined;
    const out = await autoDispatchLeadGenerationStockRoundRobin({
      agents: input.agents,
      maxActiveStockPerAgent: input.maxActiveStockPerAgent,
      importBatchId: input.importBatchId,
      stockFilters: input.stockFilters,
      maxAssignmentsThisRun: budget,
    });
    rounds += 1;
    agentsConsidered = out.agents_considered;
    total += out.total_assigned;
    remaining = out.remaining_leads;
    for (const [label, n] of Object.entries(out.distribution_par_agent)) {
      merged.set(label, (merged.get(label) ?? 0) + n);
    }
    if (out.total_assigned === 0) break;
  }

  const distribution_par_agent: Record<string, number> = {};
  for (const [k, v] of merged) {
    if (v > 0) distribution_par_agent[k] = v;
  }

  return {
    total_assigned: total,
    rounds,
    distribution_par_agent,
    remaining_leads: remaining,
    agents_considered: agentsConsidered,
  };
}
