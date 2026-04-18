import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationManualReviewRow } from "../domain/manual-review";
import { lgTable } from "../lib/lg-db";

export type LeadGenerationManualReviewListItem = LeadGenerationManualReviewRow & {
  reviewer_display_name: string;
};

/**
 * Historique des revues manuelles pour une fiche (plus récent en premier).
 */
export async function getLeadGenerationManualReviews(
  stockId: string,
): Promise<LeadGenerationManualReviewListItem[]> {
  const supabase = await createClient();
  const t = lgTable(supabase, "lead_generation_manual_reviews");

  const { data: rows, error } = await t
    .select("*")
    .eq("stock_id", stockId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Revue manuelle lead generation : ${error.message}`);
  }

  const list = (rows ?? []) as LeadGenerationManualReviewRow[];
  const ids = [...new Set(list.map((r) => r.reviewed_by_user_id))];
  if (ids.length === 0) {
    return [];
  }

  const { data: profs, error: pErr } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids);

  if (pErr) {
    throw new Error(`Profils revue : ${pErr.message}`);
  }

  const nameById = new Map<string, string>();
  for (const p of profs ?? []) {
    const row = p as { id: string; full_name: string | null; email: string | null };
    nameById.set(row.id, row.full_name?.trim() || row.email?.trim() || "Utilisateur");
  }

  return list.map((r) => ({
    ...r,
    reviewer_display_name: nameById.get(r.reviewed_by_user_id) ?? "—",
  }));
}
