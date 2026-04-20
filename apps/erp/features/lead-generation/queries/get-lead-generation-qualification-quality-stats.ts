import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";

import { AUTO_OOT_DUPLICATE_REJECTION } from "../lib/out-of-target";
import { listImportBatchIdsForQuantificationOwner } from "../lib/quantification-batch-ownership";
import type { QuantificationImportBatchScope } from "../lib/quantification-viewer-scope";
import { lgTable } from "../lib/lg-db";

function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfUtcDaysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export type QualificationQualityPeriodCounts = {
  today: number;
  last7Days: number;
};

export type LeadGenerationQualificationQualityStats = {
  /** File quantification actuelle (snapshot), alignée {@link isLeadGenerationStockInQuantificationQueue}. */
  toQualifyNow: number;
  commercialReturns: QualificationQualityPeriodCounts;
  manualOutOfTarget: QualificationQualityPeriodCounts;
  autoDuplicateOutOfTarget: QualificationQualityPeriodCounts;
  requalifiedPositive: QualificationQualityPeriodCounts;
  /** Pourcentages 0–100, null si dénominateur nul. */
  rates: {
    /** Retours commerciaux (7 j) / qualifications quantificateur (7 j). */
    returnVsQualify7d: number | null;
    /** Hors cible manuels (7 j) / (hors cible manuels + qualifications quantif. 7 j). */
    outOfTargetShare7d: number | null;
    /** Requalifiés après retour (7 j) / retours commerciaux (7 j). */
    requalifyVsReturns7d: number | null;
  };
};

async function stockIdsInScope(
  supabase: SupabaseClient<Database>,
  stockIds: string[],
  importBatchIds: string[] | null,
): Promise<Set<string>> {
  if (stockIds.length === 0) {
    return new Set();
  }
  if (importBatchIds !== null && importBatchIds.length === 0) {
    return new Set();
  }
  if (importBatchIds === null) {
    return new Set(stockIds);
  }
  const stockT = lgTable(supabase, "lead_generation_stock");
  const CHUNK = 200;
  const out = new Set<string>();
  for (let i = 0; i < stockIds.length; i += CHUNK) {
    const chunk = stockIds.slice(i, i + CHUNK);
    const { data, error } = await stockT
      .select("id")
      .in("id", chunk)
      .in("import_batch_id", importBatchIds);
    if (error) {
      throw new Error(error.message);
    }
    for (const r of data ?? []) {
      out.add((r as { id: string }).id);
    }
  }
  return out;
}

function distinctStockIdsForReviews(
  rows: { stock_id: string; created_at: string }[] | null | undefined,
  scoped: Set<string>,
  sinceToday: string,
): { today: number; last7Days: number } {
  const in7 = new Set<string>();
  const today = new Set<string>();
  for (const r of rows ?? []) {
    if (!scoped.has(r.stock_id)) {
      continue;
    }
    in7.add(r.stock_id);
    if (r.created_at >= sinceToday) {
      today.add(r.stock_id);
    }
  }
  return { today: today.size, last7Days: in7.size };
}

function roundPct(num: number): number {
  return Math.round(num * 10) / 10;
}

/**
 * Pilotage qualité de qualification : volumes et ratios légers (audit + stock).
 * Périmètre aligné sur la page quantification (`own` vs `all`).
 */
export async function getLeadGenerationQualificationQualityStats(
  batchScope: QuantificationImportBatchScope = { mode: "all" },
): Promise<LeadGenerationQualificationQualityStats> {
  const supabase = await createClient();
  const stockT = lgTable(supabase, "lead_generation_stock");
  const reviewsT = lgTable(supabase, "lead_generation_manual_reviews");

  const startToday = startOfUtcDayIso();
  const start7 = startOfUtcDaysAgoIso(7);

  let importBatchIds: string[] | null = null;
  if (batchScope.mode === "own") {
    importBatchIds = await listImportBatchIdsForQuantificationOwner(supabase, batchScope.userId);
    if (importBatchIds.length === 0) {
      return {
        toQualifyNow: 0,
        commercialReturns: { today: 0, last7Days: 0 },
        manualOutOfTarget: { today: 0, last7Days: 0 },
        autoDuplicateOutOfTarget: { today: 0, last7Days: 0 },
        requalifiedPositive: { today: 0, last7Days: 0 },
        rates: { returnVsQualify7d: null, outOfTargetShare7d: null, requalifyVsReturns7d: null },
      };
    }
  }

  let pendingQ = stockT
    .select("*", { count: "exact", head: true })
    .in("qualification_status", ["to_validate", "pending"])
    .is("converted_lead_id", null)
    .is("current_assignment_id", null)
    .is("duplicate_of_stock_id", null)
    .in("stock_status", ["new", "ready"]);
  if (importBatchIds) {
    pendingQ = pendingQ.in("import_batch_id", importBatchIds);
  }

  const [
    pendingRes,
    returnRowsRes,
    ootQuantRes,
    ootHubRes,
    qualifyRowsRes,
    autoOotTodayRes,
    autoOot7Res,
  ] = await Promise.all([
    pendingQ,
    reviewsT
      .select("stock_id, created_at")
      .eq("review_type", "agent_return_review")
      .eq("review_decision", "commercial_return_to_quantification")
      .gte("created_at", start7)
      .limit(8000),
    reviewsT
      .select("stock_id, created_at")
      .eq("review_type", "quantifier_review")
      .eq("review_decision", "quantifier_out_of_target")
      .gte("created_at", start7)
      .limit(8000),
    reviewsT
      .select("stock_id, created_at")
      .eq("review_type", "stock_review")
      .eq("review_decision", "close_stock")
      .like("review_notes", "hors_cible_pilotage:%")
      .gte("created_at", start7)
      .limit(8000),
    reviewsT
      .select("stock_id, created_at")
      .eq("review_type", "quantifier_review")
      .eq("review_decision", "quantifier_qualify")
      .gte("created_at", start7)
      .limit(8000),
    (() => {
      let q = stockT
        .select("*", { count: "exact", head: true })
        .eq("rejection_reason", AUTO_OOT_DUPLICATE_REJECTION)
        .gte("created_at", startToday);
      if (importBatchIds) {
        q = q.in("import_batch_id", importBatchIds);
      }
      return q;
    })(),
    (() => {
      let q = stockT
        .select("*", { count: "exact", head: true })
        .eq("rejection_reason", AUTO_OOT_DUPLICATE_REJECTION)
        .gte("created_at", start7);
      if (importBatchIds) {
        q = q.in("import_batch_id", importBatchIds);
      }
      return q;
    })(),
  ]);

  if (returnRowsRes.error) {
    throw new Error(returnRowsRes.error.message);
  }
  if (ootQuantRes.error) {
    throw new Error(ootQuantRes.error.message);
  }
  if (ootHubRes.error) {
    throw new Error(ootHubRes.error.message);
  }
  if (qualifyRowsRes.error) {
    throw new Error(qualifyRowsRes.error.message);
  }
  if (autoOotTodayRes.error) {
    throw new Error(autoOotTodayRes.error.message);
  }
  if (autoOot7Res.error) {
    throw new Error(autoOot7Res.error.message);
  }
  if (pendingRes.error) {
    throw new Error(pendingRes.error.message);
  }

  const returnRows = (returnRowsRes.data ?? []) as { stock_id: string; created_at: string }[];
  const ootQuantRows = (ootQuantRes.data ?? []) as { stock_id: string; created_at: string }[];
  const ootHubRows = (ootHubRes.data ?? []) as { stock_id: string; created_at: string }[];
  const qualifyRows = (qualifyRowsRes.data ?? []) as { stock_id: string; created_at: string }[];

  const reviewStockIds = [
    ...new Set([
      ...returnRows.map((r) => r.stock_id),
      ...ootQuantRows.map((r) => r.stock_id),
      ...ootHubRows.map((r) => r.stock_id),
      ...qualifyRows.map((r) => r.stock_id),
    ]),
  ];

  const scoped = await stockIdsInScope(supabase, reviewStockIds, importBatchIds);

  const commercialReturns = distinctStockIdsForReviews(returnRows, scoped, startToday);

  const manualOotKeys7 = new Set<string>();
  const manualOotKeysToday = new Set<string>();
  function ingestManual(rows: { stock_id: string; created_at: string }[]) {
    for (const r of rows) {
      if (!scoped.has(r.stock_id)) {
        continue;
      }
      manualOotKeys7.add(r.stock_id);
      if (r.created_at >= startToday) {
        manualOotKeysToday.add(r.stock_id);
      }
    }
  }
  ingestManual(ootQuantRows);
  ingestManual(ootHubRows);
  const manualOutOfTarget = { today: manualOotKeysToday.size, last7Days: manualOotKeys7.size };

  const autoDuplicateOutOfTarget = {
    today: autoOotTodayRes.count ?? 0,
    last7Days: autoOot7Res.count ?? 0,
  };

  const returnEventsScoped = returnRows.filter((r) => scoped.has(r.stock_id));

  const qualifyScopedRows = qualifyRows.filter((r) => scoped.has(r.stock_id));
  const requalStockIds = [...new Set(qualifyScopedRows.map((r) => r.stock_id))];

  const returnByStockFull = new Map<string, string[]>();
  const CHUNK = 120;
  for (let i = 0; i < requalStockIds.length; i += CHUNK) {
    const chunk = requalStockIds.slice(i, i + CHUNK);
    if (chunk.length === 0) {
      continue;
    }
    const { data: retData, error: retErr } = await reviewsT
      .select("stock_id, created_at")
      .eq("review_type", "agent_return_review")
      .eq("review_decision", "commercial_return_to_quantification")
      .in("stock_id", chunk);
    if (retErr) {
      throw new Error(retErr.message);
    }
    for (const r of retData ?? []) {
      const row = r as { stock_id: string; created_at: string };
      if (!scoped.has(row.stock_id)) {
        continue;
      }
      const list = returnByStockFull.get(row.stock_id) ?? [];
      list.push(row.created_at);
      returnByStockFull.set(row.stock_id, list);
    }
  }

  const requalified7 = new Set<string>();
  const requalifiedToday = new Set<string>();
  for (const q of qualifyScopedRows) {
    const returns = returnByStockFull.get(q.stock_id) ?? [];
    if (!returns.some((t) => t < q.created_at)) {
      continue;
    }
    requalified7.add(q.stock_id);
    if (q.created_at >= startToday) {
      requalifiedToday.add(q.stock_id);
    }
  }
  const requalifiedPositive = { today: requalifiedToday.size, last7Days: requalified7.size };

  const qualifyEventsScoped7 = qualifyScopedRows.length;
  const returnEvents7 = returnEventsScoped.length;
  const manualOotEvents7 = ootQuantRows.filter((r) => scoped.has(r.stock_id)).length +
    ootHubRows.filter((r) => scoped.has(r.stock_id)).length;

  const returnVsQualify7d =
    qualifyEventsScoped7 > 0 ? roundPct((returnEvents7 / qualifyEventsScoped7) * 100) : null;
  const denomOot = manualOotEvents7 + qualifyEventsScoped7;
  const outOfTargetShare7d = denomOot > 0 ? roundPct((manualOotEvents7 / denomOot) * 100) : null;
  const distinctReturnStocks7 = new Set(returnEventsScoped.map((r) => r.stock_id)).size;
  const requalifyVsReturns7d =
    distinctReturnStocks7 > 0 ? roundPct((requalified7.size / distinctReturnStocks7) * 100) : null;

  return {
    toQualifyNow: pendingRes.count ?? 0,
    commercialReturns,
    manualOutOfTarget,
    autoDuplicateOutOfTarget,
    requalifiedPositive,
    rates: {
      returnVsQualify7d,
      outOfTargetShare7d,
      requalifyVsReturns7d,
    },
  };
}
