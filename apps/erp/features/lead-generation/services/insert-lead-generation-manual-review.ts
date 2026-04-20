import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import type {
  LeadGenerationManualReviewDecision,
  LeadGenerationManualReviewType,
} from "../domain/manual-review";
import { lgTable } from "../lib/lg-db";

export async function insertLeadGenerationManualReviewRow(opts: {
  stockId: string;
  reviewedByUserId: string;
  reviewType: LeadGenerationManualReviewType;
  reviewDecision: LeadGenerationManualReviewDecision;
  reviewNotes: string | null;
  previousSnapshot: Json;
  newSnapshot: Json;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const reviewsT = lgTable(supabase, "lead_generation_manual_reviews");
  const { data, error } = await reviewsT
    .insert({
      stock_id: opts.stockId,
      reviewed_by_user_id: opts.reviewedByUserId,
      review_type: opts.reviewType,
      review_decision: opts.reviewDecision,
      review_notes: opts.reviewNotes,
      previous_snapshot: opts.previousSnapshot,
      new_snapshot: opts.newSnapshot,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Enregistrement de l’audit impossible." };
  }
  return { ok: true, id: (data as { id: string }).id };
}
