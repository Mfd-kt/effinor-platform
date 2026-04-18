import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

/**
 * Fiches « prêtes » à scorer en priorité : jamais scorées d’abord, puis les plus récentes.
 */
export async function getReadyStockIdsForCommercialScoreQuick(limit: number): Promise<string[]> {
  const cap = Math.min(Math.max(1, limit), 100);
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const { data, error } = await stock
    .select("id")
    .eq("stock_status", "ready")
    .order("commercial_scored_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(cap);

  if (error) {
    throw new Error(`Sélection fiches prêtes (score) : ${error.message}`);
  }

  return (data ?? []).map((r: { id: string }) => r.id);
}
