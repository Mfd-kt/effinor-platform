import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

const MAX = 100;

/**
 * Fiches du lot (coordinateur) encore à compléter (email ou site), même logique que la sélection globale.
 */
export async function getLeadGenerationStockIdsNeedingContactImprovementForBatch(
  importBatchId: string,
  limit: number,
): Promise<string[]> {
  const cap = Math.min(Math.max(1, limit), MAX);
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const { data, error } = await stock
    .select("id")
    .eq("import_batch_id", importBatchId)
    .is("converted_lead_id", null)
    .eq("stock_status", "ready")
    .is("duplicate_of_stock_id", null)
    .neq("qualification_status", "rejected")
    .neq("qualification_status", "duplicate")
    .not("phone", "is", null)
    .neq("phone", "")
    .in("enrichment_status", ["not_started", "failed"])
    .or("email.is.null,website.is.null")
    .order("created_at", { ascending: false })
    .limit(cap);

  if (error) {
    throw new Error(`Sélection fiches à compléter (lot) : ${error.message}`);
  }

  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}

export async function countLeadGenerationStockNeedingContactImprovementForBatch(
  importBatchId: string,
): Promise<number> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const { count, error } = await stock
    .select("*", { count: "exact", head: true })
    .eq("import_batch_id", importBatchId)
    .is("converted_lead_id", null)
    .eq("stock_status", "ready")
    .is("duplicate_of_stock_id", null)
    .neq("qualification_status", "rejected")
    .neq("qualification_status", "duplicate")
    .not("phone", "is", null)
    .neq("phone", "")
    .in("enrichment_status", ["not_started", "failed"])
    .or("email.is.null,website.is.null");

  if (error) {
    throw new Error(`Comptage fiches à compléter (lot) : ${error.message}`);
  }

  return count ?? 0;
}
