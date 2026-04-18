import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

const DEFAULT_LIMIT = 100;

/**
 * Recalcul closing rapide : fiches actives avec signal fort (premium, décideur, ou prêtes).
 */
export async function getLeadGenerationStockIdsForClosingRecalcQuick(input?: {
  limit?: number;
}): Promise<string[]> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const lim = Math.min(100, Math.max(1, input?.limit ?? DEFAULT_LIMIT));

  const { data, error } = await stock
    .select("id")
    .eq("stock_status", "ready")
    .is("duplicate_of_stock_id", null)
    .neq("qualification_status", "duplicate")
    .neq("qualification_status", "rejected")
    .or("lead_tier.eq.premium,decision_maker_name.not.is.null,dispatch_queue_status.eq.ready_now")
    .order("updated_at", { ascending: false })
    .limit(lim);

  if (error) {
    throw new Error(`Sélection recalcul closing : ${error.message}`);
  }

  return (data ?? []).map((r) => (r as { id: string }).id);
}
