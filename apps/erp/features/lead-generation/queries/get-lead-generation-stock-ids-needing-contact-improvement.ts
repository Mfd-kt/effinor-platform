import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

const MAX = 50;

/**
 * Fiches « prêtes » avec téléphone mais email OU site encore manquant — cible prioritaire avant analyse / file.
 * (Aligné sur l’enrichissement automatique : compléter les coordonnées avant de scorer « dans le vide ».)
 */
export async function getLeadGenerationStockIdsNeedingContactImprovement(limit: number): Promise<string[]> {
  const cap = Math.min(Math.max(1, limit), MAX);
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const { data, error } = await stock
    .select("id")
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
    throw new Error(`Sélection fiches à compléter : ${error.message}`);
  }

  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}

export async function countLeadGenerationStockNeedingContactImprovement(): Promise<number> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const { count, error } = await stock
    .select("*", { count: "exact", head: true })
    .eq("stock_status", "ready")
    .is("duplicate_of_stock_id", null)
    .neq("qualification_status", "rejected")
    .neq("qualification_status", "duplicate")
    .not("phone", "is", null)
    .neq("phone", "")
    .in("enrichment_status", ["not_started", "failed"])
    .or("email.is.null,website.is.null");

  if (error) {
    throw new Error(`Comptage fiches à compléter : ${error.message}`);
  }

  return count ?? 0;
}
