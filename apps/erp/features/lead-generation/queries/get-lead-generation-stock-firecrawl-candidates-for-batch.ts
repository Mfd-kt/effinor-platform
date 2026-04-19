import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";

const SCAN_MAX = 500;

/**
 * Candidats larges pour l’étape Firecrawl du lot (filtrage métier ensuite via
 * `isEligibleForVerifiedLeadGenerationEnrichment`).
 */
export async function getLeadGenerationStockFirecrawlCandidatesForBatch(
  importBatchId: string,
  scanLimit: number,
): Promise<LeadGenerationStockRow[]> {
  const cap = Math.min(Math.max(1, scanLimit), SCAN_MAX);
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const { data, error } = await stock
    .select("*")
    .eq("import_batch_id", importBatchId)
    .eq("stock_status", "ready")
    .is("duplicate_of_stock_id", null)
    .neq("qualification_status", "duplicate")
    .neq("qualification_status", "rejected")
    .neq("stock_status", "rejected")
    .not("phone", "is", null)
    .neq("enrichment_status", "in_progress")
    .order("created_at", { ascending: true })
    .limit(cap);

  if (error) {
    throw new Error(`Sélection candidats Firecrawl (lot) : ${error.message}`);
  }

  return (data ?? []) as LeadGenerationStockRow[];
}
