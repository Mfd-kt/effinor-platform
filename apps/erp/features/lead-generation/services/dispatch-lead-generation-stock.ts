import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

import type {
  DispatchLeadGenerationStockForAgentsResult,
  DispatchLeadGenerationStockResult,
} from "../domain/dispatch-result";
import { buildDispatchLeadGenerationStockClaimRpcParams } from "../lib/build-dispatch-lead-generation-rpc-params";
import { getLeadGenerationDispatchPolicy } from "../lib/agent-dispatch-policy";
import { computeAgentActiveStock, computeAgentActiveStockForCeeSheet } from "../lib/compute-agent-active-stock";
import { MY_QUEUE_MANUAL_CHUNK_DEFAULT } from "../lib/my-queue-manual-dispatch";
import {
  maybeRecordLeadGenerationDispatchResumed,
  recordLeadGenerationDispatchAssignedEvents,
  recordLeadGenerationDispatchBlockedEvent,
} from "../lib/lead-generation-dispatch-journal";
import { refreshLeadGenerationAssignmentSla } from "./refresh-lead-generation-assignment-sla";
import type { GetLeadGenerationStockFilters } from "../queries/get-lead-generation-stock";

const SELECTED_QUEUE = "ready_now" as const;

type RpcClaimRow = { stock_id: string; assignment_id: string };

async function runDispatchClaimRpc(
  supabase: SupabaseClient,
  agentId: string,
  limit: number,
  stockFilters?: GetLeadGenerationStockFilters,
): Promise<RpcClaimRow[]> {
  const safeLimit = Math.max(0, Math.floor(limit));
  if (safeLimit === 0) {
    return [];
  }
  const batchNumber = Math.floor(Date.now() / 1000);
  const { data, error } = await supabase.rpc("dispatch_lead_generation_stock_claim", {
    p_agent_id: agentId,
    p_limit: safeLimit,
    p_batch_number: batchNumber,
    ...buildDispatchLeadGenerationStockClaimRpcParams(stockFilters),
  });
  if (error) {
    throw new Error(`Dispatch lead generation : ${error.message}`);
  }
  return (data ?? []) as RpcClaimRow[];
}

function resultFromClaim(
  agentId: string,
  previousStock: number,
  requestedCount: number,
  rows: RpcClaimRow[],
  newStock: number,
  dispatchBlockedReason?: string | null,
): DispatchLeadGenerationStockResult {
  const assignedStockIds = rows.map((r) => r.stock_id);
  const assignedCount = assignedStockIds.length;
  return {
    agentId,
    previousStock,
    requestedCount,
    assignedCount,
    remainingNeed: requestedCount - assignedCount,
    selectedQueueStatus: SELECTED_QUEUE,
    newStock,
    assignedStockIds,
    dispatchBlockedReason: dispatchBlockedReason ?? null,
  };
}

/**
 * Recharge le stock neuf : si sous le seuil (moitié du plafond effectif), complète jusqu’au plafond
 * (plafond ajusté par {@link getLeadGenerationDispatchPolicy}).
 */
export async function dispatchLeadGenerationStockForAgent(
  agentId: string,
): Promise<DispatchLeadGenerationStockResult> {
  const supabase = await createClient();

  const policy = await getLeadGenerationDispatchPolicy(supabase, agentId);
  if (policy.suspendInjection) {
    await recordLeadGenerationDispatchBlockedEvent(supabase, agentId, policy.suspensionReason);
    const { count: previousStock } = await computeAgentActiveStock(supabase, agentId);
    return {
      agentId,
      previousStock,
      requestedCount: 0,
      assignedCount: 0,
      remainingNeed: 0,
      selectedQueueStatus: SELECTED_QUEUE,
      newStock: previousStock,
      assignedStockIds: [],
      dispatchBlockedReason: policy.suspensionReason,
    };
  }

  const targetStock = policy.effectiveStockCap;
  const thresholdStock = Math.max(20, Math.floor(targetStock * 0.5));

  const { count: previousStock } = await computeAgentActiveStock(supabase, agentId);

  if (previousStock >= thresholdStock) {
    return {
      agentId,
      previousStock,
      requestedCount: 0,
      assignedCount: 0,
      remainingNeed: 0,
      selectedQueueStatus: SELECTED_QUEUE,
      newStock: previousStock,
      assignedStockIds: [],
    };
  }

  const toAssign = targetStock - previousStock;
  if (toAssign <= 0) {
    return {
      agentId,
      previousStock,
      requestedCount: 0,
      assignedCount: 0,
      remainingNeed: 0,
      selectedQueueStatus: SELECTED_QUEUE,
      newStock: previousStock,
      assignedStockIds: [],
    };
  }

  const rows = await runDispatchClaimRpc(supabase, agentId, toAssign, undefined);
  await recordLeadGenerationDispatchAssignedEvents(supabase, agentId, rows);
  for (const r of rows) {
    await refreshLeadGenerationAssignmentSla(supabase, r.assignment_id, { notifyOnBreach: true });
  }
  await maybeRecordLeadGenerationDispatchResumed(supabase, agentId, rows.length);
  const { count: newStock } = await computeAgentActiveStock(supabase, agentId);

  return resultFromClaim(agentId, previousStock, toAssign, rows, newStock ?? previousStock);
}

/**
 * Attribue jusqu’à `chunkSize` fiches `ready_now` à l’agent, sans seuil « stock &lt; 50 »,
 * mais en ne dépassant jamais le plafond par fiche CEE (voir config dispatch en base) lorsqu’une fiche est sélectionnée.
 */
export async function dispatchLeadGenerationMyQueueChunkForAgent(
  agentId: string,
  chunkSize: number = MY_QUEUE_MANUAL_CHUNK_DEFAULT,
  ceeSheetId?: string | null,
): Promise<DispatchLeadGenerationStockResult> {
  const supabase = await createClient();
  const sheet = ceeSheetId?.trim();

  const policy = await getLeadGenerationDispatchPolicy(supabase, agentId);
  if (policy.suspendInjection) {
    await recordLeadGenerationDispatchBlockedEvent(supabase, agentId, policy.suspensionReason);
    const { count: previousStockGlobal } = await computeAgentActiveStock(supabase, agentId);
    const { count: previousStockCee } = sheet
      ? await computeAgentActiveStockForCeeSheet(supabase, agentId, sheet)
      : { count: previousStockGlobal };
    const previousStock = sheet ? previousStockCee : previousStockGlobal;
    return {
      agentId,
      previousStock,
      requestedCount: 0,
      assignedCount: 0,
      remainingNeed: 0,
      selectedQueueStatus: SELECTED_QUEUE,
      newStock: previousStock,
      assignedStockIds: [],
      dispatchBlockedReason: policy.suspensionReason,
    };
  }

  const cap = policy.effectiveStockCap;

  const { count: previousStockGlobal } = await computeAgentActiveStock(supabase, agentId);
  const { count: previousStockCee } = sheet
    ? await computeAgentActiveStockForCeeSheet(supabase, agentId, sheet)
    : { count: previousStockGlobal };

  /** Pour le plafond : par fiche CEE si le contexte est ciblé, sinon global (comportement historique). */
  const previousStock = sheet ? previousStockCee : previousStockGlobal;
  const desired = Math.min(cap, Math.max(0, Math.floor(chunkSize)));
  const headroom = Math.max(0, cap - previousStock);
  const lim = Math.min(desired, headroom);

  if (lim <= 0) {
    return {
      agentId,
      previousStock,
      requestedCount: 0,
      assignedCount: 0,
      remainingNeed: 0,
      selectedQueueStatus: SELECTED_QUEUE,
      newStock: previousStock,
      assignedStockIds: [],
    };
  }

  const filters: GetLeadGenerationStockFilters | undefined = sheet ? { cee_sheet_id: sheet } : undefined;
  const rows = await runDispatchClaimRpc(supabase, agentId, lim, filters);
  await recordLeadGenerationDispatchAssignedEvents(supabase, agentId, rows);
  for (const r of rows) {
    await refreshLeadGenerationAssignmentSla(supabase, r.assignment_id, { notifyOnBreach: true });
  }
  await maybeRecordLeadGenerationDispatchResumed(supabase, agentId, rows.length);
  const { count: newStockAfter } = sheet
    ? await computeAgentActiveStockForCeeSheet(supabase, agentId, sheet)
    : await computeAgentActiveStock(supabase, agentId);

  return resultFromClaim(agentId, previousStock, lim, rows, newStockAfter ?? previousStock);
}

/**
 * Dispatch séquentiel pour plusieurs agents (même logique que {@link dispatchLeadGenerationStockForAgent} par id).
 */
export async function dispatchLeadGenerationStockForAgents(
  agentIds: string[],
): Promise<DispatchLeadGenerationStockForAgentsResult> {
  const agents: DispatchLeadGenerationStockResult[] = [];
  for (const id of agentIds) {
    agents.push(await dispatchLeadGenerationStockForAgent(id));
  }
  return { agents };
}
