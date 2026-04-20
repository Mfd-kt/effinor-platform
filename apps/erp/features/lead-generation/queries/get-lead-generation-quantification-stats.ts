import { createClient } from "@/lib/supabase/server";

import { listImportBatchIdsForQuantificationOwner } from "../lib/quantification-batch-ownership";
import type { QuantificationImportBatchScope } from "../lib/quantification-viewer-scope";
import { lgTable } from "../lib/lg-db";

function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export type LeadGenerationQuantificationStats = {
  pendingCount: number;
  qualifiedTodayCount: number;
  outOfTargetTodayCount: number;
};

export async function getLeadGenerationQuantificationStats(
  batchScope: QuantificationImportBatchScope = { mode: "all" },
): Promise<LeadGenerationQuantificationStats> {
  const supabase = await createClient();
  const stockT = lgTable(supabase, "lead_generation_stock");
  const reviewsT = lgTable(supabase, "lead_generation_manual_reviews");
  const start = startOfUtcDayIso();

  let importBatchIds: string[] | null = null;
  if (batchScope.mode === "own") {
    importBatchIds = await listImportBatchIdsForQuantificationOwner(supabase, batchScope.userId);
  }

  let pendingQ = stockT
    .select("*", { count: "exact", head: true })
    .in("qualification_status", ["to_validate", "pending"])
    .is("converted_lead_id", null)
    .is("current_assignment_id", null)
    .is("duplicate_of_stock_id", null)
    .in("stock_status", ["new", "ready"]);
  if (importBatchIds) {
    if (importBatchIds.length === 0) {
      return { pendingCount: 0, qualifiedTodayCount: 0, outOfTargetTodayCount: 0 };
    }
    pendingQ = pendingQ.in("import_batch_id", importBatchIds);
  }

  async function countQuantifierReviewsToday(decision: "quantifier_qualify" | "quantifier_out_of_target") {
    const { data: revRows, error: revErr } = await reviewsT
      .select("stock_id")
      .eq("review_type", "quantifier_review")
      .eq("review_decision", decision)
      .gte("created_at", start);
    if (revErr) {
      throw new Error(revErr.message);
    }
    const stockIds = [...new Set((revRows ?? []).map((r: { stock_id: string }) => r.stock_id).filter(Boolean))];
    if (stockIds.length === 0) {
      return 0;
    }
    let sq = stockT
      .select("*", { count: "exact", head: true })
      .in("id", stockIds);
    if (importBatchIds) {
      if (importBatchIds.length === 0) {
        return 0;
      }
      sq = sq.in("import_batch_id", importBatchIds);
    }
    const { count, error: cErr } = await sq;
    if (cErr) {
      throw new Error(cErr.message);
    }
    return count ?? 0;
  }

  const [pendingRes, qualifiedTodayCount, outOfTargetTodayCount] = await Promise.all([
    pendingQ,
    importBatchIds && importBatchIds.length === 0
      ? Promise.resolve(0)
      : countQuantifierReviewsToday("quantifier_qualify"),
    importBatchIds && importBatchIds.length === 0
      ? Promise.resolve(0)
      : countQuantifierReviewsToday("quantifier_out_of_target"),
  ]);

  return {
    pendingCount: pendingRes.count ?? 0,
    qualifiedTodayCount,
    outOfTargetTodayCount,
  };
}
