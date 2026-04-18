import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";

import { computeLeadGenerationCommercialScore } from "./compute-commercial-score";

export type RecalculateLeadGenerationCommercialScoreResult = {
  stockId: string;
  score: number;
  priority: string;
};

async function loadStockRow(stockId: string): Promise<LeadGenerationStockRow | null> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const { data, error } = await stock.select("*").eq("id", stockId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as LeadGenerationStockRow | null;
}

/**
 * Recalcule et persiste le score commercial (étape 12).
 */
export async function recalculateLeadGenerationCommercialScore(
  stockId: string,
): Promise<RecalculateLeadGenerationCommercialScoreResult> {
  const row = await loadStockRow(stockId);
  if (!row) {
    throw new Error("Fiche introuvable.");
  }

  const { settings } = await getLeadGenerationSettings();
  const { score, priority, breakdown } = computeLeadGenerationCommercialScore(
    row,
    settings.commercialScoring,
  );
  const now = new Date().toISOString();

  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const { error } = await stock
    .update({
      commercial_score: score,
      commercial_priority: priority,
      commercial_score_breakdown: breakdown,
      commercial_scored_at: now,
      updated_at: now,
    })
    .eq("id", stockId);

  if (error) {
    throw new Error(error.message);
  }

  return { stockId, score, priority };
}
