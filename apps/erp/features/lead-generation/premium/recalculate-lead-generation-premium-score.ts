import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";

import { computeLeadGenerationPremiumScore } from "./compute-premium-score";

export type RecalculateLeadGenerationPremiumScoreResult = {
  stockId: string;
  premiumScore: number;
  leadTier: string;
};

async function loadStockRow(stockId: string): Promise<LeadGenerationStockRow | null> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const { data, error } = await stock.select("*").eq("id", stockId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as LeadGenerationStockRow | null;
}

export async function recalculateLeadGenerationPremiumScore(input: {
  stockId: string;
}): Promise<RecalculateLeadGenerationPremiumScoreResult> {
  const row = await loadStockRow(input.stockId);
  if (!row) {
    throw new Error("Fiche introuvable.");
  }

  const { premiumScore, leadTier, premiumReasons } = computeLeadGenerationPremiumScore(row);
  const now = new Date().toISOString();

  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const { error } = await stock
    .update({
      premium_score: premiumScore,
      lead_tier: leadTier,
      premium_reasons: premiumReasons,
      premium_scored_at: now,
      updated_at: now,
    })
    .eq("id", input.stockId);

  if (error) {
    throw new Error(error.message);
  }

  return { stockId: input.stockId, premiumScore, leadTier };
}

export type RecalculateLeadGenerationPremiumScoreBatchSummary = {
  totalRequested: number;
  totalScored: number;
  totalFailed: number;
  failedStockIds: string[];
};

export async function recalculateLeadGenerationPremiumScoreBatch(input: {
  stockIds: string[];
}): Promise<RecalculateLeadGenerationPremiumScoreBatchSummary> {
  const ids = input.stockIds.slice(0, 100);
  const failedStockIds: string[] = [];
  let totalScored = 0;

  for (const stockId of ids) {
    try {
      await recalculateLeadGenerationPremiumScore({ stockId });
      totalScored += 1;
    } catch {
      failedStockIds.push(stockId);
    }
  }

  return {
    totalRequested: ids.length,
    totalScored,
    totalFailed: failedStockIds.length,
    failedStockIds,
  };
}

export type RecalculatePremiumReadyStockQuickSummary = RecalculateLeadGenerationPremiumScoreBatchSummary;

/**
 * Recalcule un lot borné : fiches prêtes « ready_now » ou avec décideur renseigné (priorité aux scores premium non calculés).
 */
export async function recalculatePremiumReadyStockQuick(input: {
  limit?: number;
}): Promise<RecalculatePremiumReadyStockQuickSummary> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const lim = Math.min(Math.max(1, input.limit ?? 30), 100);

  const { data, error } = await stock
    .select("id")
    .eq("stock_status", "ready")
    .or("dispatch_queue_status.eq.ready_now,decision_maker_name.not.is.null")
    .order("premium_scored_at", { ascending: true, nullsFirst: true })
    .order("updated_at", { ascending: false })
    .limit(lim);

  if (error) {
    throw new Error(error.message);
  }

  const ids = (data ?? []).map((r) => (r as { id: string }).id);
  return recalculateLeadGenerationPremiumScoreBatch({ stockIds: ids });
}
