import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "./lg-db";

const MAX_CHAIN = 12;

/**
 * Remonte la chaîne `duplicate_of_stock_id` jusqu’à la fiche canonique (racine).
 */
export async function resolveCanonicalLeadGenerationStock(
  supabase: SupabaseClient<Database>,
  row: LeadGenerationStockRow,
): Promise<LeadGenerationStockRow> {
  let current = row;
  const stock = lgTable(supabase, "lead_generation_stock");
  for (let i = 0; i < MAX_CHAIN; i++) {
    const parentId = current.duplicate_of_stock_id?.trim();
    if (!parentId) {
      return current;
    }
    const { data, error } = await stock.select("*").eq("id", parentId).maybeSingle();
    if (error || !data) {
      return current;
    }
    current = data as LeadGenerationStockRow;
  }
  return current;
}
