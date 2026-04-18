import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 40;

/**
 * Cible un lot restreint de fiches fortes pour identification décideur (pas tout le stock).
 */
export async function getLeadGenerationStockIdsForPremiumDecisionMakerBatch(input?: {
  limit?: number;
}): Promise<string[]> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const raw = input?.limit ?? DEFAULT_LIMIT;
  const lim = Math.min(MAX_LIMIT, Math.max(1, raw));

  const { data, error } = await stock
    .select("id")
    .eq("stock_status", "ready")
    .is("duplicate_of_stock_id", null)
    .neq("qualification_status", "duplicate")
    .neq("qualification_status", "rejected")
    .eq("phone_status", "found")
    .not("normalized_phone", "is", null)
    .neq("dispatch_queue_status", "do_not_dispatch")
    .is("converted_lead_id", null)
    .or("dispatch_queue_status.eq.ready_now,commercial_priority.in.(high,critical)")
    .or("decision_maker_confidence.is.null,decision_maker_confidence.neq.high")
    .order("commercial_score", { ascending: false })
    .order("dispatch_queue_rank", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(lim);

  if (error) {
    throw new Error(`Sélection batch décideur premium : ${error.message}`);
  }

  return (data ?? []).map((r) => (r as { id: string }).id);
}
