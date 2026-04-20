import { createClient } from "@/lib/supabase/server";

import type {
  QuantifierActivityItem,
  QuantifierPersonalDashboardData,
  QuantifierPersonalRanking,
  QuantifierPersonalWindow,
} from "../domain/quantifier-personal-dashboard";
import { buildLeadGenerationQuantifierPersonalAlerts } from "../lib/build-lead-generation-quantifier-personal-alerts";
import { lgTable } from "../lib/lg-db";
import {
  QUANTIFIER_DAILY_TARGET_QUALIFIED,
  QUANTIFIER_DAILY_TARGET_TREATED,
} from "../lib/quantifier-personal-dashboard-config";
import {
  estimateQuantifierPrimeEur,
  pickQuantifierRow,
  quantifierPerformanceScore100,
  quantifierScoreBadge,
  workQualityBadge,
} from "../lib/quantifier-personal-score";
import {
  getLeadGenerationManagementDashboard,
  type LeadGenerationManagementDashboard,
  type QuantifierManagementRow,
} from "./get-lead-generation-management-dashboard";

export type {
  QuantifierActivityItem,
  QuantifierPersonalAlert,
  QuantifierPersonalAlertKind,
  QuantifierPersonalDashboardData,
  QuantifierPersonalRanking,
  QuantifierPersonalWindow,
} from "../domain/quantifier-personal-dashboard";

const MIN_DECISIONS_FOR_TEAM_COMPARE = 4;
const ACTIVITY_LIMIT = 14;

function windowFromDashboard(
  d: LeadGenerationManagementDashboard,
  userId: string,
): QuantifierPersonalWindow {
  const me = pickQuantifierRow(d.quantifiers, userId);
  const q = me?.qualifiedEventsInPeriod ?? 0;
  const o = me?.outOfTargetEventsInPeriod ?? 0;
  const treated = q + o;
  const biz = d.overview.business;
  const rdvVsQ = q > 0 ? Math.round((100 * biz.withRdv) / q) : null;
  const accVsQ = q > 0 ? Math.round((100 * biz.withAccord) / q) : null;
  return {
    treated,
    qualified: q,
    outOfTarget: o,
    qualifyRatePercent: me?.qualifyRatePercent ?? (treated > 0 ? Math.round((100 * q) / treated) : null),
    returnRatePercent: me?.returnRatePercent ?? null,
    commercialReturns: me?.commercialReturnsInPeriod ?? d.overview.commercialReturnsInPeriod,
    autoDuplicateOot: me?.autoDuplicateOotInPeriod ?? d.overview.autoDuplicateOotInPeriod,
    convertedLeads: biz.convertedLeads,
    withRdv: biz.withRdv,
    withAccord: biz.withAccord,
    withVt: biz.withVt,
    withInstallation: biz.withInstallation,
    rdvVsQualifiedPercent: rdvVsQ,
    accordVsQualifiedPercent: accVsQ,
    requalifiedAfterReturn: me?.requalifiedPositiveInPeriod ?? 0,
    rejectedAfterControl: d.quality.finalOotAfterReturnInPeriod,
  };
}

async function loadDisplayName(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) {
    return userId.slice(0, 8);
  }
  const row = data as { full_name: string | null; email: string | null };
  return row.full_name?.trim() || row.email?.trim() || userId.slice(0, 8);
}

async function loadRecentActivity(userId: string, batchIds: string[]): Promise<QuantifierActivityItem[]> {
  if (batchIds.length === 0) {
    return [];
  }
  const supabase = await createClient();
  const reviewsT = lgTable(supabase, "lead_generation_manual_reviews");
  const stockT = lgTable(supabase, "lead_generation_stock");
  const CHUNK = 120;
  const companyByStock = new Map<string, string>();
  for (let i = 0; i < batchIds.length; i += CHUNK) {
    const chunk = batchIds.slice(i, i + CHUNK);
    const { data: stocks, error: sErr } = await stockT
      .select("id, company_name")
      .in("import_batch_id", chunk);
    if (sErr) {
      continue;
    }
    for (const s of stocks ?? []) {
      const row = s as { id: string; company_name: string | null };
      companyByStock.set(row.id, row.company_name?.trim() || "—");
    }
  }
  const stockIdList = [...companyByStock.keys()];
  if (stockIdList.length === 0) {
    return [];
  }

  type Raw = { created_at: string; review_type: string; review_decision: string; stock_id: string };
  const { data: mine, error: mErr } = await reviewsT
    .select("created_at, review_type, review_decision, stock_id")
    .eq("reviewed_by_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);
  if (mErr) {
    return [];
  }

  const returnChunks: Raw[] = [];
  for (let i = 0; i < stockIdList.length; i += CHUNK) {
    const ch = stockIdList.slice(i, i + CHUNK);
    const { data: ret, error: rErr } = await reviewsT
      .select("created_at, review_type, review_decision, stock_id")
      .eq("review_type", "agent_return_review")
      .eq("review_decision", "commercial_return_to_quantification")
      .in("stock_id", ch)
      .order("created_at", { ascending: false })
      .limit(25);
    if (!rErr && ret?.length) {
      returnChunks.push(...(ret as Raw[]));
    }
  }

  const merged: QuantifierActivityItem[] = [];
  const pushIf = (row: Raw) => {
    const name = companyByStock.get(row.stock_id);
    if (!name) {
      return;
    }
    let kind: QuantifierActivityItem["kind"] | null = null;
    if (row.review_type === "quantifier_review" && row.review_decision === "quantifier_qualify") {
      kind = "qualify";
    } else if (row.review_type === "quantifier_review" && row.review_decision === "quantifier_out_of_target") {
      kind = "oot";
    } else if (
      row.review_type === "agent_return_review" &&
      row.review_decision === "commercial_return_to_quantification"
    ) {
      kind = "return";
    }
    if (kind) {
      merged.push({ kind, companyName: name, at: row.created_at });
    }
  };

  for (const r of mine ?? []) {
    pushIf(r as Raw);
  }
  for (const r of returnChunks) {
    pushIf(r);
  }

  merged.sort((a, b) => (a.at < b.at ? 1 : -1));
  const seen = new Set<string>();
  const deduped: QuantifierActivityItem[] = [];
  for (const item of merged) {
    const k = `${item.kind}-${item.companyName}-${item.at}`;
    if (seen.has(k)) {
      continue;
    }
    seen.add(k);
    deduped.push(item);
    if (deduped.length >= ACTIVITY_LIMIT) {
      break;
    }
  }
  return deduped;
}

function buildRanking(input: {
  userId: string;
  team7: LeadGenerationManagementDashboard;
  teamToday: LeadGenerationManagementDashboard;
  me7: QuantifierManagementRow | null;
}): QuantifierPersonalRanking {
  const { userId, team7, teamToday, me7 } = input;
  const withActivity = team7.quantifiers.filter(
    (q) => q.qualifiedEventsInPeriod + q.outOfTargetEventsInPeriod > 0,
  );
  const scores = withActivity.map((q) => ({
    userId: q.userId,
    score: quantifierPerformanceScore100(q),
    qualified: q.qualifiedEventsInPeriod,
  }));
  scores.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.qualified - a.qualified;
  });
  const pos = scores.findIndex((s) => s.userId === userId);
  const position = pos >= 0 ? pos + 1 : null;
  const teamSize = team7.quantifiers.length;
  const comparePool = team7.quantifiers.filter(
    (q) => q.qualifiedEventsInPeriod + q.outOfTargetEventsInPeriod >= MIN_DECISIONS_FOR_TEAM_COMPARE,
  );
  const avg =
    comparePool.length > 0
      ? comparePool.reduce((s, q) => s + quantifierPerformanceScore100(q), 0) / comparePool.length
      : null;
  const myScore = me7 ? quantifierPerformanceScore100(me7) : 0;
  const aboveAverage = avg != null && myScore >= avg;

  const todayRows = teamToday.quantifiers.map((q) => ({
    userId: q.userId,
    name: q.displayName,
    qn: q.qualifiedEventsInPeriod,
  }));
  todayRows.sort((a, b) => b.qn - a.qn);
  const top = todayRows[0];
  const meToday = teamToday.quantifiers.find((q) => q.userId === userId);

  return {
    position,
    teamSize,
    aboveAverage,
    teamAverageScore: avg != null ? Math.round(avg * 10) / 10 : null,
    topPerformerTodayDisplayName: top && top.qn > 0 ? top.name : null,
    topPerformerTodayQualifyCount: top?.qn ?? 0,
    userTodayQualifyCount: meToday?.qualifiedEventsInPeriod ?? 0,
  };
}

export async function getLeadGenerationQuantifierPersonalDashboard(
  userId: string,
): Promise<QuantifierPersonalDashboardData> {
  const [dToday, d7, d30, team7, teamToday, displayName] = await Promise.all([
    getLeadGenerationManagementDashboard({ period: "today", quantifierUserId: userId, ceeSheetId: null }),
    getLeadGenerationManagementDashboard({ period: "7d", quantifierUserId: userId, ceeSheetId: null }),
    getLeadGenerationManagementDashboard({ period: "30d", quantifierUserId: userId, ceeSheetId: null }),
    getLeadGenerationManagementDashboard({ period: "7d", quantifierUserId: null, ceeSheetId: null }),
    getLeadGenerationManagementDashboard({ period: "today", quantifierUserId: null, ceeSheetId: null }),
    loadDisplayName(userId),
  ]);

  const batchIds = d30.batches.map((b) => b.batchId);
  const me7 = pickQuantifierRow(d7.quantifiers, userId);
  const meToday = pickQuantifierRow(dToday.quantifiers, userId);
  const scoreVal = quantifierPerformanceScore100(
    me7 ?? {
      qualifyRatePercent: null,
      returnRatePercent: null,
      qualifiedEventsInPeriod: 0,
    },
  );

  const primeToday = estimateQuantifierPrimeEur({
    qualifiedEventsInPeriod: meToday?.qualifiedEventsInPeriod ?? 0,
    qualifyRatePercent: meToday?.qualifyRatePercent ?? null,
    business: dToday.overview.business,
  });
  const primeWeek = estimateQuantifierPrimeEur({
    qualifiedEventsInPeriod: me7?.qualifiedEventsInPeriod ?? 0,
    qualifyRatePercent: me7?.qualifyRatePercent ?? null,
    business: d7.overview.business,
  });
  const me30 = pickQuantifierRow(d30.quantifiers, userId);
  const primeMonth = estimateQuantifierPrimeEur({
    qualifiedEventsInPeriod: me30?.qualifiedEventsInPeriod ?? 0,
    qualifyRatePercent: me30?.qualifyRatePercent ?? null,
    business: d30.overview.business,
  });

  const ranking = buildRanking({ userId, team7, teamToday, me7 });

  const activity = await loadRecentActivity(userId, batchIds);

  const todayWindow = windowFromDashboard(dToday, userId);

  const base: Omit<QuantifierPersonalDashboardData, "alerts"> = {
    userId,
    displayName,
    today: todayWindow,
    week: windowFromDashboard(d7, userId),
    month: windowFromDashboard(d30, userId),
    score: { value: scoreVal, badge: quantifierScoreBadge(scoreVal) },
    primeToday,
    primeWeek,
    primeMonth,
    qualityBadge: workQualityBadge(me7?.returnRatePercent ?? null),
    ranking,
    goals: {
      targetTreated: QUANTIFIER_DAILY_TARGET_TREATED,
      targetQualified: QUANTIFIER_DAILY_TARGET_QUALIFIED,
      treated: todayWindow.treated,
      qualified: todayWindow.qualified,
    },
    activity,
  };

  return {
    ...base,
    alerts: buildLeadGenerationQuantifierPersonalAlerts(base),
  };
}
