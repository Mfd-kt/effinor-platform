import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import { formatLeadGenerationSourceLabel } from "../lib/lead-generation-display";
import {
  rankLeadGenerationBusinessLots,
  type BusinessLotLeaderboardResult,
} from "../lib/rank-lead-generation-business-lots-for-management";
import { rankLeadGenerationQuantifiersForManagement } from "../lib/rank-lead-generation-quantifiers-for-management";
import { AUTO_OOT_DUPLICATE_REJECTION } from "../lib/out-of-target";
import { lgTable } from "../lib/lg-db";
import {
  emptyBusinessOutcomesPadded,
  getLeadGenerationManagementBusinessOutcomes,
  type BusinessOutcomeCounts,
  type BusinessOutcomeRates,
} from "./get-lead-generation-management-business-outcomes";

export type ManagementDashboardPeriod = "today" | "7d" | "30d";

export type ManagementDashboardBatchScope = {
  /** Filtre lots : propriétaire (quantificateur). */
  quantifierUserId: string | null;
  /** Filtre lots : fiche CEE (UUID). */
  ceeSheetId: string | null;
};

export type ManagementDashboardFilters = ManagementDashboardBatchScope & {
  period: ManagementDashboardPeriod;
};

function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfPeriodIso(period: ManagementDashboardPeriod): string {
  if (period === "today") {
    return startOfUtcDayIso();
  }
  const days = period === "7d" ? 7 : 30;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function summarizeBatchMetadata(metadata: Json | null | undefined): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const o = metadata as Record<string, unknown>;
  const loc = typeof o.locationQuery === "string" ? o.locationQuery.trim() : "";
  const ss = o.searchStrings;
  const kw =
    Array.isArray(ss) && ss.length > 0
      ? ss
          .map((x) => (typeof x === "string" ? x.trim() : ""))
          .filter(Boolean)
          .slice(0, 3)
          .join(", ")
      : "";
  const parts = [kw ? `${kw}` : "", loc ? `${loc}` : ""].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

const REVIEW_LIMIT = 12000;

type BatchRow = {
  id: string;
  created_by_user_id: string | null;
  created_at: string;
  cee_sheet_id: string | null;
  cee_sheet_code: string | null;
  imported_count: number | null;
  accepted_count: number | null;
  metadata_json: Json | null;
  source: string | null;
  source_label: string | null;
};

function lotDisplayLabel(meta: BatchRow): string {
  const custom = (meta.source_label ?? "").trim();
  if (custom) {
    return custom;
  }
  const src = (meta.source ?? "").trim();
  if (src) {
    return formatLeadGenerationSourceLabel(src);
  }
  const summ = summarizeBatchMetadata(meta.metadata_json);
  if (summ) {
    return summ;
  }
  const id = meta.id;
  return id.length <= 12 ? id : `${id.slice(0, 8)}…`;
}

async function loadFilteredBatches(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: ManagementDashboardBatchScope,
): Promise<BatchRow[]> {
  const batchesT = lgTable(supabase, "lead_generation_import_batches");
  let q = batchesT
    .select(
      "id, created_by_user_id, created_at, cee_sheet_id, cee_sheet_code, imported_count, accepted_count, metadata_json, source, source_label",
    )
    .not("created_by_user_id", "is", null);
  if (filters.ceeSheetId?.trim()) {
    q = q.eq("cee_sheet_id", filters.ceeSheetId.trim());
  }
  if (filters.quantifierUserId?.trim()) {
    q = q.eq("created_by_user_id", filters.quantifierUserId.trim());
  }
  const { data, error } = await q;
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as BatchRow[];
}

async function countQueuedStocksInBatches(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchIds: string[],
): Promise<number> {
  if (batchIds.length === 0) {
    return 0;
  }
  const stockT = lgTable(supabase, "lead_generation_stock");
  const CHUNK = 120;
  let total = 0;
  for (let i = 0; i < batchIds.length; i += CHUNK) {
    const chunk = batchIds.slice(i, i + CHUNK);
    let q = stockT
      .select("*", { count: "exact", head: true })
      .in("import_batch_id", chunk)
      .in("qualification_status", ["to_validate", "pending"])
      .is("converted_lead_id", null)
      .is("current_assignment_id", null)
      .is("duplicate_of_stock_id", null)
      .in("stock_status", ["new", "ready"]);
    const { count, error } = await q;
    if (error) {
      throw new Error(error.message);
    }
    total += count ?? 0;
  }
  return total;
}

type ReviewRow = { stock_id: string; created_at: string; reviewed_by_user_id?: string };

async function loadReviewsSince(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startIso: string,
): Promise<{
  qualify: ReviewRow[];
  ootQuant: ReviewRow[];
  ootHub: ReviewRow[];
  returns: ReviewRow[];
}> {
  const reviewsT = lgTable(supabase, "lead_generation_manual_reviews");
  const [qualifyRes, ootQuantRes, ootHubRes, retRes] = await Promise.all([
    reviewsT
      .select("stock_id, created_at, reviewed_by_user_id")
      .eq("review_type", "quantifier_review")
      .eq("review_decision", "quantifier_qualify")
      .gte("created_at", startIso)
      .limit(REVIEW_LIMIT),
    reviewsT
      .select("stock_id, created_at, reviewed_by_user_id")
      .eq("review_type", "quantifier_review")
      .eq("review_decision", "quantifier_out_of_target")
      .gte("created_at", startIso)
      .limit(REVIEW_LIMIT),
    reviewsT
      .select("stock_id, created_at, reviewed_by_user_id")
      .eq("review_type", "stock_review")
      .eq("review_decision", "close_stock")
      .like("review_notes", "hors_cible_pilotage:%")
      .gte("created_at", startIso)
      .limit(REVIEW_LIMIT),
    reviewsT
      .select("stock_id, created_at, reviewed_by_user_id")
      .eq("review_type", "agent_return_review")
      .eq("review_decision", "commercial_return_to_quantification")
      .gte("created_at", startIso)
      .limit(REVIEW_LIMIT),
  ]);
  for (const r of [qualifyRes, ootQuantRes, ootHubRes, retRes]) {
    if (r.error) {
      throw new Error(r.error.message);
    }
  }
  return {
    qualify: (qualifyRes.data ?? []) as ReviewRow[],
    ootQuant: (ootQuantRes.data ?? []) as ReviewRow[],
    ootHub: (ootHubRes.data ?? []) as ReviewRow[],
    returns: (retRes.data ?? []) as ReviewRow[],
  };
}

async function mapStockToBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stockIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (stockIds.length === 0) {
    return out;
  }
  const stockT = lgTable(supabase, "lead_generation_stock");
  const CHUNK = 200;
  for (let i = 0; i < stockIds.length; i += CHUNK) {
    const chunk = stockIds.slice(i, i + CHUNK);
    const { data, error } = await stockT
      .select("id, import_batch_id")
      .in("id", chunk)
      .not("import_batch_id", "is", null);
    if (error) {
      throw new Error(error.message);
    }
    for (const r of data ?? []) {
      const row = r as { id: string; import_batch_id: string };
      out.set(row.id, row.import_batch_id);
    }
  }
  return out;
}

function buildBatchMeta(batches: BatchRow[]) {
  const idSet = new Set(batches.map((b) => b.id));
  const byId = new Map(batches.map((b) => [b.id, b] as const));
  const ownerByBatch = new Map<string, string>();
  for (const b of batches) {
    if (b.created_by_user_id) {
      ownerByBatch.set(b.id, b.created_by_user_id);
    }
  }
  return { idSet, byId, ownerByBatch };
}

function filterReviewsByBatchScope(
  rows: ReviewRow[],
  stockToBatch: Map<string, string>,
  batchIdSet: Set<string>,
): ReviewRow[] {
  return rows.filter((r) => {
    const bid = stockToBatch.get(r.stock_id);
    return bid && batchIdSet.has(bid);
  });
}

/** Fiches requalifiées positivement après au moins un retour commercial (au moins une qualification après retour). */
function countRequalifiedAfterReturn(
  qualifyRows: ReviewRow[],
  returnRows: ReviewRow[],
  stockToBatch: Map<string, string>,
  batchIdSet: Set<string>,
): number {
  const qf = filterReviewsByBatchScope(qualifyRows, stockToBatch, batchIdSet);
  const rt = filterReviewsByBatchScope(returnRows, stockToBatch, batchIdSet);
  const returnsByStock = new Map<string, string[]>();
  for (const r of rt) {
    const list = returnsByStock.get(r.stock_id) ?? [];
    list.push(r.created_at);
    returnsByStock.set(r.stock_id, list);
  }
  const seen = new Set<string>();
  for (const q of qf) {
    const times = returnsByStock.get(q.stock_id) ?? [];
    if (times.some((t) => t < q.created_at)) {
      seen.add(q.stock_id);
    }
  }
  return seen.size;
}

/** Fiches passées hors cible (quantif ou pilotage) après au moins un retour commercial. */
function countOotAfterReturn(
  ootRows: ReviewRow[],
  returnRows: ReviewRow[],
  stockToBatch: Map<string, string>,
  batchIdSet: Set<string>,
): number {
  const oot = filterReviewsByBatchScope(ootRows, stockToBatch, batchIdSet);
  const rt = filterReviewsByBatchScope(returnRows, stockToBatch, batchIdSet);
  const returnsByStock = new Map<string, string[]>();
  for (const r of rt) {
    const list = returnsByStock.get(r.stock_id) ?? [];
    list.push(r.created_at);
    returnsByStock.set(r.stock_id, list);
  }
  const seen = new Set<string>();
  for (const o of oot) {
    const times = returnsByStock.get(o.stock_id) ?? [];
    if (times.some((t) => t < o.created_at)) {
      seen.add(o.stock_id);
    }
  }
  return seen.size;
}

export type ManagementOverviewKpis = {
  toQualifyNow: number;
  qualifiedInPeriod: number;
  outOfTargetInPeriod: number;
  commercialReturnsInPeriod: number;
  autoDuplicateOotInPeriod: number;
  batchesCreatedInPeriod: number;
  batchesCreatedLast7Days: number;
  /** Qualifications / (qualifications + hors cible manuel), événements sur la période. */
  qualifyRatePercent: number | null;
  /** Retours / qualifications (événements), % sur la période. */
  returnRatePercent: number | null;
  /**
   * Conversion business depuis les leads issus du stock (période = `leads.created_at`).
   * Voir {@link getLeadGenerationManagementBusinessOutcomes}.
   */
  business: BusinessOutcomeCounts & { rates: BusinessOutcomeRates };
};

export type QuantifierManagementRow = {
  userId: string;
  displayName: string;
  email: string | null;
  batchesCreatedInPeriod: number;
  rawImportedInPeriod: number;
  qualifiedEventsInPeriod: number;
  outOfTargetEventsInPeriod: number;
  commercialReturnsInPeriod: number;
  qualifyRatePercent: number | null;
  returnRatePercent: number | null;
  toProcessNow: number;
  lastActivityAt: string | null;
  requalifiedPositiveInPeriod: number;
  autoDuplicateOotInPeriod: number;
  business: BusinessOutcomeCounts & { rates: BusinessOutcomeRates };
};

export type BatchManagementRow = {
  batchId: string;
  /** Libellé lot (source personnalisée, source système, ou résumé recherche). */
  lotLabel: string;
  ownerUserId: string | null;
  ownerDisplay: string | null;
  createdAt: string;
  ceeSheetCode: string | null;
  searchSummary: string | null;
  importedRaw: number;
  accepted: number;
  qualified: number;
  outOfTarget: number;
  toProcess: number;
  qualifyRatePercent: number | null;
  commercialReturnsInPeriod: number;
  returnRatePercent: number | null;
  business: BusinessOutcomeCounts & { rates: BusinessOutcomeRates };
};

export type ManagementQualityBlock = {
  returnsInPeriod: number;
  requalifiedPositiveInPeriod: number;
  finalOotAfterReturnInPeriod: number;
};

export type ManagementHighlights = {
  topQualifyRate: QuantifierManagementRow[];
  lowestReturnRate: QuantifierManagementRow[];
  watchHighReturn: QuantifierManagementRow[];
  watchLowQualify: QuantifierManagementRow[];
  topBatches: BatchManagementRow[];
  problemBatches: BatchManagementRow[];
};

export type ManagementFilterOption = { id: string; label: string };

export type LeadGenerationManagementDashboard = {
  filters: ManagementDashboardFilters;
  overview: ManagementOverviewKpis;
  quantifiers: QuantifierManagementRow[];
  /** Top / Bottom quantificateurs (données dérivées de `quantifiers`, sans requête supplémentaire). */
  quantifierLeaderboard: ReturnType<typeof rankLeadGenerationQuantifiersForManagement<QuantifierManagementRow>>;
  /** Top / Bottom lots sur les outcomes business (même agrégats que le tableau lots). */
  businessLotLeaderboard: BusinessLotLeaderboardResult;
  batches: BatchManagementRow[];
  quality: ManagementQualityBlock;
  highlights: ManagementHighlights;
  filterOptions: {
    quantifiers: ManagementFilterOption[];
    ceeSheets: ManagementFilterOption[];
  };
};

type StockAgg = { qualified: number; rejected: number; pendingWork: number };

function emptyAgg(): StockAgg {
  return { qualified: 0, rejected: 0, pendingWork: 0 };
}

function accumulateStock(
  agg: Map<string, StockAgg>,
  batchId: string | null,
  qualificationStatus: string,
  stockStatus: string,
  convertedLeadId: string | null,
  currentAssignmentId: string | null,
  duplicateOfStockId: string | null,
) {
  if (!batchId?.trim()) {
    return;
  }
  const id = batchId.trim();
  if (!agg.has(id)) {
    agg.set(id, emptyAgg());
  }
  const a = agg.get(id)!;
  if (qualificationStatus === "qualified") {
    a.qualified += 1;
    return;
  }
  if (qualificationStatus === "rejected") {
    a.rejected += 1;
    return;
  }
  if (
    (qualificationStatus === "pending" || qualificationStatus === "to_validate") &&
    !convertedLeadId &&
    !currentAssignmentId &&
    !duplicateOfStockId &&
    (stockStatus === "new" || stockStatus === "ready")
  ) {
    a.pendingWork += 1;
  }
}

export async function getLeadGenerationManagementDashboard(
  filters: ManagementDashboardFilters,
): Promise<LeadGenerationManagementDashboard> {
  const supabase = await createClient();
  const stockT = lgTable(supabase, "lead_generation_stock");

  const periodStart = startOfPeriodIso(filters.period);
  const start7 = startOfPeriodIso("7d");
  const startToday = startOfUtcDayIso();

  const batches = await loadFilteredBatches(supabase, filters);
  const { idSet: batchIdSet, byId: batchById, ownerByBatch } = buildBatchMeta(batches);
  const batchIds = [...batchIdSet];

  const batchIdToOwnerUserId = new Map<string, string>();
  for (const b of batches) {
    if (b.created_by_user_id) {
      batchIdToOwnerUserId.set(b.id, b.created_by_user_id);
    }
  }
  const businessOutcomes = await getLeadGenerationManagementBusinessOutcomes({
    batchIds,
    batchIdToOwnerUserId,
    periodStartIso: periodStart,
  });

  const toQualifyNow = await countQueuedStocksInBatches(supabase, batchIds);

  const reviews = await loadReviewsSince(supabase, periodStart);
  const allStockIds = [
    ...new Set([
      ...reviews.qualify.map((r) => r.stock_id),
      ...reviews.ootQuant.map((r) => r.stock_id),
      ...reviews.ootHub.map((r) => r.stock_id),
      ...reviews.returns.map((r) => r.stock_id),
    ]),
  ];
  const stockToBatch = await mapStockToBatch(supabase, allStockIds);

  const qualifyScoped = filterReviewsByBatchScope(reviews.qualify, stockToBatch, batchIdSet);
  const ootQuantScoped = filterReviewsByBatchScope(reviews.ootQuant, stockToBatch, batchIdSet);
  const ootHubScoped = filterReviewsByBatchScope(reviews.ootHub, stockToBatch, batchIdSet);
  const returnsScoped = filterReviewsByBatchScope(reviews.returns, stockToBatch, batchIdSet);
  const manualOotEvents = ootQuantScoped.length + ootHubScoped.length;
  const qualifyEvents = qualifyScoped.length;
  const returnEvents = returnsScoped.length;

  const requalifiedPositiveInPeriod = countRequalifiedAfterReturn(
    reviews.qualify,
    reviews.returns,
    stockToBatch,
    batchIdSet,
  );
  const finalOotAfterReturnInPeriod = countOotAfterReturn(
    [...reviews.ootQuant, ...reviews.ootHub],
    reviews.returns,
    stockToBatch,
    batchIdSet,
  );

  let autoOotInPeriod = 0;
  const CHUNK = 150;
  for (let i = 0; i < batchIds.length; i += CHUNK) {
    const chunk = batchIds.slice(i, i + CHUNK);
    const { count, error } = await stockT
      .select("*", { count: "exact", head: true })
      .eq("rejection_reason", AUTO_OOT_DUPLICATE_REJECTION)
      .gte("created_at", periodStart)
      .in("import_batch_id", chunk);
    if (error) {
      throw new Error(error.message);
    }
    autoOotInPeriod += count ?? 0;
  }

  const batchesCreatedInPeriod = batches.filter((b) => b.created_at >= periodStart).length;
  const batchesCreatedLast7Days = batches.filter((b) => b.created_at >= start7).length;

  const denomQualify = qualifyEvents + manualOotEvents;
  const qualifyRatePercent = denomQualify > 0 ? round1((100 * qualifyEvents) / denomQualify) : null;
  const returnRatePercent =
    qualifyEvents > 0 ? round1((100 * returnEvents) / qualifyEvents) : null;

  const overview: ManagementOverviewKpis = {
    toQualifyNow,
    qualifiedInPeriod: qualifyEvents,
    outOfTargetInPeriod: manualOotEvents,
    commercialReturnsInPeriod: returnEvents,
    autoDuplicateOotInPeriod: autoOotInPeriod,
    batchesCreatedInPeriod,
    batchesCreatedLast7Days,
    qualifyRatePercent,
    returnRatePercent,
    business: businessOutcomes.global,
  };

  const ownerIds = [...new Set(batches.map((b) => b.created_by_user_id).filter(Boolean) as string[])];
  const profilesById = new Map<string, { full_name: string | null; email: string | null }>();
  if (ownerIds.length > 0) {
    const { data: profs, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ownerIds);
    if (pErr) {
      throw new Error(pErr.message);
    }
    for (const p of profs ?? []) {
      const row = p as { id: string; full_name: string | null; email: string | null };
      profilesById.set(row.id, { full_name: row.full_name, email: row.email });
    }
  }

  function displayNameFor(userId: string): { displayName: string; email: string | null } {
    const p = profilesById.get(userId);
    const email = p?.email?.trim() ?? null;
    const displayName = p?.full_name?.trim() || email || userId.slice(0, 8);
    return { displayName, email };
  }

  const aggByOwner = new Map<
    string,
    {
      qualify: ReviewRow[];
      oot: ReviewRow[];
      returns: ReviewRow[];
    }
  >();
  function pushOwnerRow(owner: string, kind: "qualify" | "oot" | "returns", row: ReviewRow) {
    if (!aggByOwner.has(owner)) {
      aggByOwner.set(owner, { qualify: [], oot: [], returns: [] });
    }
    const b = aggByOwner.get(owner)!;
    b[kind].push(row);
  }
  for (const r of qualifyScoped) {
    const bid = stockToBatch.get(r.stock_id);
    const owner = bid ? ownerByBatch.get(bid) : undefined;
    if (owner) {
      pushOwnerRow(owner, "qualify", r);
    }
  }
  for (const r of [...ootQuantScoped, ...ootHubScoped]) {
    const bid = stockToBatch.get(r.stock_id);
    const owner = bid ? ownerByBatch.get(bid) : undefined;
    if (owner) {
      pushOwnerRow(owner, "oot", r);
    }
  }
  for (const r of returnsScoped) {
    const bid = stockToBatch.get(r.stock_id);
    const owner = bid ? ownerByBatch.get(bid) : undefined;
    if (owner) {
      pushOwnerRow(owner, "returns", r);
    }
  }

  const quantifiers: QuantifierManagementRow[] = [];
  for (const userId of ownerIds) {
    const ownedBatchIds = batches.filter((b) => b.created_by_user_id === userId).map((b) => b.id);
    if (ownedBatchIds.length === 0) {
      continue;
    }
    const batchesInPeriod = batches.filter(
      (b) => b.created_by_user_id === userId && b.created_at >= periodStart,
    );
    const rawImportedInPeriod = batchesInPeriod.reduce((s, b) => s + (b.imported_count ?? 0), 0);
    const ob = aggByOwner.get(userId) ?? { qualify: [], oot: [], returns: [] };
    const qe = ob.qualify.length;
    const oe = ob.oot.length;
    const re = ob.returns.length;
    const dec = qe + oe;
    const qRate = dec > 0 ? round1((100 * qe) / dec) : null;
    const rRate = qe > 0 ? round1((100 * re) / qe) : null;
    const { displayName, email } = displayNameFor(userId);

    let autoDup = 0;
    for (let i = 0; i < ownedBatchIds.length; i += CHUNK) {
      const chunk = ownedBatchIds.slice(i, i + CHUNK);
      const { count, error } = await stockT
        .select("*", { count: "exact", head: true })
        .eq("rejection_reason", AUTO_OOT_DUPLICATE_REJECTION)
        .gte("created_at", periodStart)
        .in("import_batch_id", chunk);
      if (error) {
        throw new Error(error.message);
      }
      autoDup += count ?? 0;
    }

    const rq = countRequalifiedAfterReturn(reviews.qualify, reviews.returns, stockToBatch, new Set(ownedBatchIds));

    const toProcess = await countQueuedStocksInBatches(supabase, ownedBatchIds);

    let lastAt: string | null = null;
    for (const r of [...ob.qualify, ...ob.oot, ...ob.returns]) {
      if (!lastAt || r.created_at > lastAt) {
        lastAt = r.created_at;
      }
    }
    for (const b of batches.filter((x) => x.created_by_user_id === userId)) {
      if (!lastAt || b.created_at > lastAt) {
        lastAt = b.created_at;
      }
    }

    quantifiers.push({
      userId,
      displayName,
      email,
      batchesCreatedInPeriod: batchesInPeriod.length,
      rawImportedInPeriod,
      qualifiedEventsInPeriod: qe,
      outOfTargetEventsInPeriod: oe,
      commercialReturnsInPeriod: re,
      qualifyRatePercent: qRate,
      returnRatePercent: rRate,
      toProcessNow: toProcess,
      lastActivityAt: lastAt,
      requalifiedPositiveInPeriod: rq,
      autoDuplicateOotInPeriod: autoDup,
      business: businessOutcomes.byOwnerUserId[userId] ?? emptyBusinessOutcomesPadded(),
    });
  }

  quantifiers.sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));

  const aggByBatch = new Map<string, StockAgg>();
  const recentBatchIds = [...batches]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 100)
    .map((b) => b.id);

  if (recentBatchIds.length > 0) {
    const { data: stRows, error: stErr } = await stockT
      .select(
        "import_batch_id, qualification_status, stock_status, converted_lead_id, current_assignment_id, duplicate_of_stock_id",
      )
      .in("import_batch_id", recentBatchIds);
    if (stErr) {
      throw new Error(stErr.message);
    }
    for (const row of stRows ?? []) {
      const r = row as {
        import_batch_id: string | null;
        qualification_status: string;
        stock_status: string;
        converted_lead_id: string | null;
        current_assignment_id: string | null;
        duplicate_of_stock_id: string | null;
      };
      accumulateStock(
        aggByBatch,
        r.import_batch_id,
        r.qualification_status,
        r.stock_status,
        r.converted_lead_id,
        r.current_assignment_id,
        r.duplicate_of_stock_id,
      );
    }
  }

  const returnsByBatch = new Map<string, number>();
  for (const r of returnsScoped) {
    const bid = stockToBatch.get(r.stock_id);
    if (!bid) {
      continue;
    }
    returnsByBatch.set(bid, (returnsByBatch.get(bid) ?? 0) + 1);
  }

  const batchRows: BatchManagementRow[] = recentBatchIds.map((bid) => {
    const meta = batchById.get(bid)!;
    const a = aggByBatch.get(bid) ?? emptyAgg();
    const decided = a.qualified + a.rejected;
    const qRate = decided > 0 ? round1((100 * a.qualified) / decided) : null;
    const uid = meta.created_by_user_id;
    const prof = uid ? displayNameFor(uid) : { displayName: "—", email: null };
    const ret = returnsByBatch.get(bid) ?? 0;
    const rRate = a.qualified > 0 ? round1((100 * ret) / a.qualified) : null;
    return {
      batchId: bid,
      lotLabel: lotDisplayLabel(meta),
      ownerUserId: uid,
      ownerDisplay: prof.displayName,
      createdAt: meta.created_at,
      ceeSheetCode: meta.cee_sheet_code?.trim() ?? null,
      searchSummary: summarizeBatchMetadata(meta.metadata_json),
      importedRaw: meta.imported_count ?? 0,
      accepted: meta.accepted_count ?? 0,
      qualified: a.qualified,
      outOfTarget: a.rejected,
      toProcess: a.pendingWork,
      qualifyRatePercent: qRate,
      commercialReturnsInPeriod: ret,
      returnRatePercent: rRate,
      business: businessOutcomes.byBatchId[bid] ?? emptyBusinessOutcomesPadded(),
    };
  });

  const quality: ManagementQualityBlock = {
    returnsInPeriod: returnEvents,
    requalifiedPositiveInPeriod,
    finalOotAfterReturnInPeriod,
  };

  const minDecided = 4;
  const topQualifyRate = [...quantifiers]
    .filter((q) => q.qualifiedEventsInPeriod + q.outOfTargetEventsInPeriod >= minDecided && q.qualifyRatePercent != null)
    .sort((a, b) => (b.qualifyRatePercent ?? 0) - (a.qualifyRatePercent ?? 0))
    .slice(0, 5);
  const lowestReturnRate = [...quantifiers]
    .filter((q) => q.qualifiedEventsInPeriod >= minDecided && q.returnRatePercent != null)
    .sort((a, b) => (a.returnRatePercent ?? 0) - (b.returnRatePercent ?? 0))
    .slice(0, 5);
  const watchHighReturn = quantifiers.filter(
    (q) => q.qualifiedEventsInPeriod >= 3 && (q.returnRatePercent ?? 0) >= 25,
  );
  const watchLowQualify = quantifiers.filter(
    (q) =>
      q.qualifiedEventsInPeriod + q.outOfTargetEventsInPeriod >= minDecided &&
      (q.qualifyRatePercent ?? 100) < 45,
  );

  const topBatches = [...batchRows]
    .filter((b) => b.importedRaw >= 20 && (b.qualifyRatePercent ?? 0) >= 55 && b.commercialReturnsInPeriod <= 3)
    .slice(0, 5);
  const problemBatches = [...batchRows]
    .filter(
      (b) =>
        b.importedRaw >= 15 &&
        ((b.qualifyRatePercent ?? 100) < 40 || (b.returnRatePercent ?? 0) >= 30),
    )
    .slice(0, 5);

  const allBatchesForOptions = await loadFilteredBatches(supabase, {
    quantifierUserId: null,
    ceeSheetId: null,
  });
  const allOwnerIdsForNav = [
    ...new Set(allBatchesForOptions.map((b) => b.created_by_user_id).filter(Boolean) as string[]),
  ];
  const missingOwners = allOwnerIdsForNav.filter((id) => !profilesById.has(id));
  if (missingOwners.length > 0) {
    const { data: extraProf, error: epErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", missingOwners);
    if (epErr) {
      throw new Error(epErr.message);
    }
    for (const p of extraProf ?? []) {
      const row = p as { id: string; full_name: string | null; email: string | null };
      profilesById.set(row.id, { full_name: row.full_name, email: row.email });
    }
  }
  const qOpts = [
    ...new Map(
      allOwnerIdsForNav.map((id) => {
        const { displayName } = displayNameFor(id);
        return [id, { id, label: displayName }] as const;
      }),
    ).values(),
  ].sort((a, b) => a.label.localeCompare(b.label, "fr"));
  const ceeOptsMap = new Map<string, string>();
  for (const b of allBatchesForOptions) {
    if (b.cee_sheet_id && b.cee_sheet_code) {
      ceeOptsMap.set(b.cee_sheet_id, b.cee_sheet_code);
    }
  }
  const ceeOpts = [...ceeOptsMap.entries()]
    .map(([id, code]) => ({ id, label: code }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  const quantifierLeaderboard = rankLeadGenerationQuantifiersForManagement({
    rows: quantifiers,
    singleQuantifierFilter: Boolean(filters.quantifierUserId?.trim()),
  });

  const businessLotLeaderboard = rankLeadGenerationBusinessLots(batchRows);

  return {
    filters,
    overview,
    quantifiers,
    quantifierLeaderboard,
    businessLotLeaderboard,
    batches: batchRows,
    quality,
    highlights: {
      topQualifyRate,
      lowestReturnRate,
      watchHighReturn,
      watchLowQualify,
      topBatches,
      problemBatches,
    },
    filterOptions: {
      quantifiers: qOpts,
      ceeSheets: ceeOpts,
    },
  };
}
