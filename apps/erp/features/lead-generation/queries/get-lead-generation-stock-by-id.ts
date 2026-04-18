import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationImportBatchRow, LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";

export type LeadGenerationStockDetail = {
  stock: LeadGenerationStockRow;
  import_batch: LeadGenerationImportBatchRow | null;
};

/**
 * Détail d’une fiche stock + batch d’import associé si présent.
 */
export async function getLeadGenerationStockById(id: string): Promise<LeadGenerationStockDetail | null> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const { data: row, error } = await stock.select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(`Fiche stock : ${error.message}`);
  }
  if (!row) {
    return null;
  }

  const stockTyped = row as LeadGenerationStockRow;

  if (!stockTyped.import_batch_id) {
    return { stock: stockTyped, import_batch: null };
  }

  const batches = lgTable(supabase, "lead_generation_import_batches");
  const { data: batch, error: bErr } = await batches
    .select("*")
    .eq("id", stockTyped.import_batch_id)
    .maybeSingle();

  if (bErr) {
    throw new Error(`Batch import : ${bErr.message}`);
  }

  return {
    stock: stockTyped,
    import_batch: batch ? (batch as LeadGenerationImportBatchRow) : null,
  };
}
