import type { CommandCockpitData, HotOpportunityRow } from "../types";
import type { CockpitAiContext } from "./cockpit-ai-types";

export type CockpitDataForAi = Omit<
  CommandCockpitData,
  "aiRecommendations" | "aiRecommendationsMeta" | "aiOrchestratorActivity"
>;

function callbackCashRank(o: HotOpportunityRow): number {
  if (o.kind !== "callback") return 0;
  let r = 0;
  if (o.overdueCallback) r += 1_000_000;
  else if (o.dueTodayCallback) r += 500_000;
  r += o.score * 1_200;
  r += Math.min(o.valueCents, 800_000);
  if (!o.lastCallAt || o.lastCallAt.trim() === "") r += 80_000;
  return r;
}

export function buildCockpitAiContext(data: CockpitDataForAi): CockpitAiContext {
  const nonTerminalCb = data.opportunities.filter((o) => o.kind === "callback");
  const topCallbacks = [...nonTerminalCb]
    .filter(
      (o) =>
        o.overdueCallback ||
        o.dueTodayCallback ||
        o.score >= 60 ||
        (o.valueCents ?? 0) >= 100_000 ||
        (!o.lastCallAt && o.score >= 45),
    )
    .sort((a, b) => callbackCashRank(b) - callbackCashRank(a))
    .slice(0, 12)
    .map((o) => ({
      id: o.id,
      company: o.company,
      score: o.score,
      valueEur: o.estimatedValueEur ?? (o.valueCents > 0 ? o.valueCents / 100 : null),
      overdue: o.overdueCallback,
      dueToday: Boolean(o.dueTodayCallback),
      neverCalled: !o.lastCallAt || o.lastCallAt.trim() === "",
      phone: o.phone,
      canConvert: o.canConvert,
    }));

  const overdueHigh = nonTerminalCb.filter((o) => o.overdueCallback && (o.valueCents ?? 0) >= 150_000);
  const overdueHighValue = {
    count: overdueHigh.length,
    sumValueEur:
      overdueHigh.reduce((s, o) => s + (o.estimatedValueEur ?? (o.valueCents > 0 ? o.valueCents / 100 : 0)), 0) || 0,
  };

  const topHotLeads = data.opportunities
    .filter((o) => o.kind === "lead" && (o.statusLabel === "Simulateur rempli" || (o.valueCents ?? 0) > 0))
    .slice(0, 6)
    .map((o) => ({
      id: o.id,
      company: o.company,
      valueEur: o.estimatedValueEur ?? (o.valueCents > 0 ? o.valueCents / 100 : null),
      phone: o.phone,
      statusLabel: o.statusLabel,
      createdAt: o.createdAt ?? "",
    }));

  const newLeadsNeedAction = data.opportunities
    .filter((o) => o.kind === "lead" && o.statusLabel === "Nouveau")
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 5)
    .map((o) => ({
      id: o.id,
      company: o.company,
      phone: o.phone,
      createdAt: o.createdAt ?? "",
    }));

  const criticalAlerts = data.alerts
    .filter((a) => a.severity === "critical")
    .slice(0, 8)
    .map((a) => ({
      id: a.id,
      title: a.title,
      href: a.href,
      message: a.message,
    }));

  const humanAnomaliesTop = data.humanAnomalies.slice(0, 3).map((h) => ({
    id: h.id,
    role: h.role,
    displayName: h.displayName,
    level: h.level,
    problem: h.problem,
    userId: h.userId,
  }));

  const closerLoads = data.performance.closers
    .filter((c) => c.pipelineOpen > 0 || c.signedWeek > 0)
    .sort((a, b) => b.pipelineOpen - a.pipelineOpen)
    .slice(0, 8)
    .map((c) => ({
      userId: c.userId,
      name: c.displayName,
      pipelineOpen: c.pipelineOpen,
      signedWeek: c.signedWeek,
      signatureRatePct: c.signatureRatePct,
    }));

  const cashTop = data.cashImmediate[0];
  const cashTopValueEur =
    cashTop != null ? cashTop.estimatedValueEur ?? (cashTop.valueCents > 0 ? cashTop.valueCents / 100 : null) : null;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      overdueCallbacks: data.callbacks.kpis.overdue,
      criticalBandCallbacks: data.callbacks.critical.length,
      hotSimulatedLeads24h: data.hotSimulatedLeads24h,
      unassignedWorkflows: data.pipeline.unassignedAgent,
      pipelineCloserOpen: data.pipeline.awaitCloser,
      automationFailed48h: data.automation.failed,
      cronHealthy: data.automation.cronHealthy,
      automationHealth: data.automation.health,
      cashTopValueEur,
    },
    topCallbacks,
    overdueHighValue,
    topHotLeads,
    criticalAlerts,
    sheetsWithoutTeam: data.sheetsWithoutTeam,
    workflowStuckBySheet: data.workflowStuckBySheet,
    humanAnomaliesTop,
    closerLoads,
    workflowLog: {
      closerMedianH: data.workflowLogMetrics.closerMedianHours,
      conversionPct: data.workflowLogMetrics.conversionRateFromLogsPct,
    },
    automation: {
      callbackFollowupFailed: data.automation.callbackAutoFollowup.failed,
      slackFailed: data.automation.slackFailed,
      emailFailed: data.automation.emailFailed,
    },
    newLeadsNeedAction,
    internalSla: data.internalSla
      ? {
          warning: data.internalSla.totals.warning,
          breached: data.internalSla.totals.breached,
          critical: data.internalSla.totals.critical,
          resolvedTodayParis: data.internalSla.totals.resolvedTodayParis,
          topRuleCodes: data.internalSla.worst.slice(0, 6).map((w) => w.ruleCode),
        }
      : null,
  };
}
