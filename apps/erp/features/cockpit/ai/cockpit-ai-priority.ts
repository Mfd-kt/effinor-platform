import type { CockpitAiPrioritySignals } from "./cockpit-ai-types";
import type { CockpitAiRecommendation } from "../types";

export type CockpitAiPriorityResult = {
  priority: CockpitAiRecommendation["priority"];
  sortScore: number;
  confidence: number;
  reasonCodes: string[];
};

/**
 * Score de tri (plus haut = agir avant). Seuils calibrés pour cash / risque / système.
 */
export function computeCockpitRecommendationPriority(
  signals: CockpitAiPrioritySignals,
): CockpitAiPriorityResult {
  const reasonCodes: string[] = [];
  let sortScore = 0;

  if (signals.automationCritical) {
    sortScore += 55_000;
    reasonCodes.push("automation_failure");
  }
  if (signals.cronUnhealthy) {
    sortScore += 48_000;
    reasonCodes.push("cron_unhealthy");
  }
  if (signals.alertCritical) {
    sortScore += 42_000;
    reasonCodes.push("cockpit_alert_critical");
  }

  const vc = signals.valueCents ?? 0;
  sortScore += Math.min(35_000, Math.round(vc / 25));

  if (signals.overdue) {
    sortScore += 22_000;
    reasonCodes.push("time_overdue");
    if (vc >= 150_000) {
      sortScore += 12_000;
      reasonCodes.push("overdue_high_value");
    }
  }

  if (signals.dueTodayCallback) {
    sortScore += 34_000;
    reasonCodes.push("callback_due_today_cash");
  }

  if (signals.callbackNeverCalled && signals.callbackScore != null && signals.callbackScore >= 40) {
    sortScore += 16_000;
    reasonCodes.push("callback_no_call_logged");
  }

  if (signals.callbackScore != null) {
    sortScore += Math.min(8_000, signals.callbackScore * 55);
    if (signals.callbackScore >= 85) reasonCodes.push("callback_score_hot");
  }

  if (signals.staffingCritical) {
    sortScore += 18_000;
    reasonCodes.push("staffing_risk");
  }

  const blocks = signals.configBlocksWorkflows ?? 0;
  if (blocks > 0) {
    sortScore += Math.min(48_000, blocks * 2_600);
    reasonCodes.push("config_blocks_pipeline");
  }

  const batch = signals.batchCount ?? 0;
  if (batch >= 2) {
    sortScore += Math.min(25_000, batch * 2_800);
    reasonCodes.push("batch_impact");
  }

  if (signals.pipelineBlocked) {
    sortScore += 14_000;
    reasonCodes.push("pipeline_blocked");
  }

  if (signals.slaHoursExcess) {
    sortScore += 12_000;
    reasonCodes.push("sla_stage_slow");
  }

  const slaCrit = signals.slaInternalCriticalCount ?? 0;
  if (slaCrit > 0) {
    sortScore += 52_000;
    reasonCodes.push("sla_critical");
  } else if ((signals.slaBreachedCount ?? 0) > 0) {
    sortScore += 36_000;
    reasonCodes.push("sla_breached");
  }

  if (signals.proximityConversion) {
    sortScore += 6_000;
    reasonCodes.push("near_conversion");
  }

  let priority: CockpitAiRecommendation["priority"];
  if (sortScore >= 38_000) priority = "critical";
  else if (sortScore >= 16_000) priority = "important";
  else priority = "opportunity";

  let confidence = 55 + reasonCodes.length * 9;
  if (signals.automationCritical || signals.cronUnhealthy) confidence += 12;
  if (vc > 0 && signals.overdue) confidence += 8;
  if (blocks >= 8) confidence += 10;
  confidence = Math.min(97, Math.round(confidence));

  return { priority, sortScore, confidence, reasonCodes };
}

/** Ordre métier : cash (callbacks / leads) → pipeline & ops → config → staffing. */
function businessTier(cat: CockpitAiRecommendation["category"]): number {
  if (cat === "callback" || cat === "lead" || cat === "cash") return 0;
  if (cat === "workflow" || cat === "automation") return 1;
  if (cat === "config") return 2;
  if (cat === "staffing") return 3;
  return 4;
}

export function sortAiRecommendations(recs: CockpitAiRecommendation[]): CockpitAiRecommendation[] {
  const rank: Record<CockpitAiRecommendation["priority"], number> = {
    critical: 0,
    important: 1,
    opportunity: 2,
  };
  return [...recs].sort((a, b) => {
    const tierDiff = businessTier(a.category) - businessTier(b.category);
    if (tierDiff !== 0) return tierDiff;
    const dr = rank[a.priority] - rank[b.priority];
    if (dr !== 0) return dr;
    const impact = (b.impactEuro ?? 0) - (a.impactEuro ?? 0);
    if (impact !== 0) return impact;
    return b.confidence - a.confidence;
  });
}
