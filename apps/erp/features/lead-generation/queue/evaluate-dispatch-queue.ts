import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";

import {
  computeLeadGenerationDispatchQueue,
  type LeadGenerationDispatchQueueDecision,
} from "./compute-lead-generation-dispatch-queue";

export type EvaluateLeadGenerationDispatchQueueBatchSummary = {
  totalRequested: number;
  /** Fiches mises à jour avec succès. */
  totalSucceeded: number;
  totalFailed: number;
  failedStockIds: string[];
  /** Décisions « prêt maintenant » (lot réussi uniquement). */
  dispatchReadyNowCount: number;
  /** Décisions « enrichir d’abord » (lot réussi uniquement). */
  dispatchEnrichFirstCount: number;
};

const BATCH_MAX = 100;

export type EvaluateLeadGenerationDispatchQueueResult = LeadGenerationDispatchQueueDecision;

/**
 * Charge la fiche, calcule la décision de file et persiste (action manuelle).
 */
export async function evaluateLeadGenerationDispatchQueue(input: {
  stockId: string;
}): Promise<{ stock: LeadGenerationStockRow; decision: LeadGenerationDispatchQueueDecision }> {
  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const { data: row, error } = await stockTable.select("*").eq("id", input.stockId).maybeSingle();
  if (error) {
    throw new Error(`Fiche stock : ${error.message}`);
  }
  if (!row) {
    throw new Error("Fiche introuvable.");
  }

  const stock = row as LeadGenerationStockRow;
  const { settings } = await getLeadGenerationSettings();
  const decision = computeLeadGenerationDispatchQueue(stock, settings.dispatchQueueRules);

  const { error: upErr } = await stockTable
    .update({
      dispatch_queue_status: decision.dispatchQueueStatus,
      dispatch_queue_reason: decision.dispatchQueueReason,
      dispatch_queue_rank: decision.dispatchQueueRank,
      dispatch_queue_evaluated_at: new Date().toISOString(),
    })
    .eq("id", input.stockId);

  if (upErr) {
    throw new Error(`Mise à jour file de dispatch : ${upErr.message}`);
  }

  return {
    stock: {
      ...stock,
      dispatch_queue_status: decision.dispatchQueueStatus,
      dispatch_queue_reason: decision.dispatchQueueReason,
      dispatch_queue_rank: decision.dispatchQueueRank,
      dispatch_queue_evaluated_at: new Date().toISOString(),
    },
    decision,
  };
}

export async function evaluateLeadGenerationDispatchQueueBatch(stockIds: string[]): Promise<EvaluateLeadGenerationDispatchQueueBatchSummary> {
  const capped = stockIds.slice(0, BATCH_MAX);
  const failedStockIds: string[] = [];
  let totalSucceeded = 0;
  let dispatchReadyNowCount = 0;
  let dispatchEnrichFirstCount = 0;

  for (const stockId of capped) {
    try {
      const { decision } = await evaluateLeadGenerationDispatchQueue({ stockId });
      totalSucceeded += 1;
      if (decision.dispatchQueueStatus === "ready_now") {
        dispatchReadyNowCount += 1;
      } else if (decision.dispatchQueueStatus === "enrich_first") {
        dispatchEnrichFirstCount += 1;
      }
    } catch {
      failedStockIds.push(stockId);
    }
  }

  return {
    totalRequested: capped.length,
    totalSucceeded,
    totalFailed: failedStockIds.length,
    failedStockIds,
    dispatchReadyNowCount,
    dispatchEnrichFirstCount,
  };
}

/**
 * Lot « prêt » : priorité aux fiches jamais évaluées pour la file, puis récemment scorées.
 */
export async function evaluateReadyLeadGenerationDispatchQueueQuick(input: { limit: number }): Promise<EvaluateLeadGenerationDispatchQueueBatchSummary> {
  const cap = Math.min(Math.max(1, input.limit), 100);
  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const { data, error } = await stockTable
    .select("id")
    .eq("stock_status", "ready")
    .order("dispatch_queue_evaluated_at", { ascending: true, nullsFirst: true })
    .order("commercial_scored_at", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(cap);

  if (error) {
    throw new Error(`Sélection fiches prêtes (file) : ${error.message}`);
  }

  const ids = (data ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) {
    return {
      totalRequested: 0,
      totalSucceeded: 0,
      totalFailed: 0,
      failedStockIds: [],
      dispatchReadyNowCount: 0,
      dispatchEnrichFirstCount: 0,
    };
  }

  return evaluateLeadGenerationDispatchQueueBatch(ids);
}
