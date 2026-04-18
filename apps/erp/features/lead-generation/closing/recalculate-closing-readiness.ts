import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";
import { computeLeadGenerationClosingReadiness } from "./compute-closing-readiness";

export async function recalculateLeadGenerationClosingReadiness(input: {
  stockId: string;
}): Promise<{ stockId: string; updated: boolean }> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const { data: row, error } = await stock.select("*").eq("id", input.stockId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Fiche introuvable.");

  const typed = row as LeadGenerationStockRow;
  const computed = computeLeadGenerationClosingReadiness(typed);
  const now = new Date().toISOString();

  const { error: upErr } = await stock
    .update({
      closing_readiness_score: computed.score,
      closing_readiness_status: computed.status,
      closing_reasons: computed.reasons,
      closing_scored_at: now,
      approach_angle: computed.approachAngle,
      approach_hook: computed.approachHook,
      updated_at: now,
    } as never)
    .eq("id", input.stockId);

  if (upErr) throw new Error(upErr.message);
  return { stockId: input.stockId, updated: true };
}

export async function recalculateLeadGenerationClosingReadinessBatch(input: {
  stockIds: string[];
}): Promise<{ processed: number; failed: string[] }> {
  const failed: string[] = [];
  let processed = 0;
  for (const id of input.stockIds) {
    try {
      await recalculateLeadGenerationClosingReadiness({ stockId: id });
      processed += 1;
    } catch {
      failed.push(id);
    }
  }
  return { processed, failed };
}
