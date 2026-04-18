import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

/** Aligné sur `ui_batch_limits.quick_enrichment_limit` (max 100 en base). */
const QUICK_LIMIT_MAX = 100;

/**
 * Fiches « prêtes » sans email, avec téléphone — cible du bouton d’enrichissement rapide.
 */
export async function getLeadGenerationStockIdsForQuickEnrichment(limit: number): Promise<string[]> {
  const cap = Math.min(Math.max(1, limit), QUICK_LIMIT_MAX);
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const { data, error } = await stock
    .select("id")
    .eq("stock_status", "ready")
    .is("email", null)
    .neq("phone", "")
    .not("phone", "is", null)
    .is("duplicate_of_stock_id", null)
    .neq("qualification_status", "rejected")
    .neq("qualification_status", "duplicate")
    .neq("stock_status", "rejected")
    .in("enrichment_status", ["not_started", "failed"])
    .order("created_at", { ascending: false })
    .limit(cap);

  if (error) {
    throw new Error(`Sélection enrichissement rapide : ${error.message}`);
  }

  const rows = (data ?? []) as { id: string }[];
  return rows.map((r) => r.id).filter((id) => id);
}
