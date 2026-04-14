import type { CeeWorkflowStatus } from "@/features/cee-workflows/domain/constants";
import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";
import type {
  CockpitAlertCta,
  CockpitAlertPriorityLevel,
  CockpitAlertSeverity,
  CockpitAlertTopWorkflow,
} from "@/features/dashboard/domain/cockpit";

const MS_DAY = 86_400_000;
const MS_HOUR = 3_600_000;

/** Valeur € par défaut si pas de simulation — ordre de grandeur prime + marge opérationnelle. */
const DEFAULT_IMPACT_EURO_BY_STATUS: Partial<Record<CeeWorkflowStatus, number>> = {
  agreement_sent: 12_000,
  to_close: 9_000,
  docs_prepared: 7_500,
  qualified: 6_500,
  to_confirm: 6_000,
  simulation_done: 5_500,
  draft: 4_000,
  quote_sent: 8_000,
  quote_pending: 7_000,
  lost: 0,
};

const STATUS_BASE_SCORE: Partial<Record<CeeWorkflowStatus, number>> = {
  agreement_sent: 118,
  to_close: 102,
  docs_prepared: 88,
  qualified: 72,
  to_confirm: 68,
  simulation_done: 58,
  draft: 36,
  quote_sent: 95,
  quote_pending: 82,
  agreement_signed: 20,
  paid: 15,
  lost: 10,
};

function qualString(q: unknown, key: string): string | null {
  if (!q || typeof q !== "object" || Array.isArray(q)) return null;
  const v = (q as Record<string, unknown>)[key];
  return typeof v === "string" && v.trim() ? v : null;
}

function numFromJson(json: unknown, key: string): number | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const v = (json as Record<string, unknown>)[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

/** Potentiel € : économies 30j sélectionnées ou prime CEE estimée dans le JSON de simulation. */
export function extractPotentialValueEur(w: WorkflowScopedListRow): number | null {
  const fromSim =
    numFromJson(w.simulation_result_json, "savingEur30Selected") ??
    numFromJson(w.simulation_result_json, "ceePrimeEstimated") ??
    numFromJson(w.simulation_result_json, "simCeePrimeEstimated");
  if (fromSim != null && fromSim > 0) return Math.round(fromSim);
  return null;
}

export function lastWorkflowTouchMs(w: WorkflowScopedListRow): number {
  const upd = new Date(w.updated_at).getTime();
  const sent = w.agreement_sent_at ? new Date(w.agreement_sent_at).getTime() : 0;
  return Math.max(upd, sent);
}

export type WorkflowPriorityContext = {
  nowMs: number;
};

export function computeWorkflowPriorityScore(
  w: WorkflowScopedListRow,
  ctx: WorkflowPriorityContext,
): number {
  const st = w.workflow_status as CeeWorkflowStatus;
  let score = STATUS_BASE_SCORE[st] ?? 44;

  const pot = extractPotentialValueEur(w);
  if (pot != null && pot > 0) {
    score += Math.min(42, Math.log10(pot + 1) * 9);
  }

  const lastMs = lastWorkflowTouchMs(w);
  const staleDays = Math.floor((ctx.nowMs - lastMs) / MS_DAY);
  score += Math.min(38, Math.max(0, staleDays) * 2.4);

  if (st === "agreement_sent" || st === "to_close") score += 14;
  if (st === "docs_prepared") score += 9;

  if (st === "agreement_sent") {
    const raw = qualString(w.qualification_data_json, "next_follow_up_at");
    if (raw) {
      const t = new Date(raw).getTime();
      if (Number.isFinite(t) && t < ctx.nowMs) score += 22;
    } else {
      score += 7;
    }
  }

  const hoursSince = (ctx.nowMs - lastMs) / MS_HOUR;
  if (hoursSince < 10) score -= 9;

  return Math.round(score * 10) / 10;
}

export function sortWorkflowsByPriority(
  workflows: WorkflowScopedListRow[],
  ctx: WorkflowPriorityContext,
): WorkflowScopedListRow[] {
  const scored = workflows.map((w) => ({ w, s: computeWorkflowPriorityScore(w, ctx) }));
  scored.sort((a, b) => b.s - a.s);
  return scored.map((x) => x.w);
}

function workflowToTopItem(
  w: WorkflowScopedListRow,
  score: number,
  ctx: WorkflowPriorityContext,
): CockpitAlertTopWorkflow {
  const lastMs = lastWorkflowTouchMs(w);
  const daysSince =
    Number.isFinite(lastMs) && lastMs > 0
      ? Math.max(0, Math.floor((ctx.nowMs - lastMs) / MS_DAY))
      : null;
  return {
    workflowId: w.id,
    leadId: w.lead_id,
    companyName: w.lead?.company_name?.trim() || "—",
    currentStatus: w.workflow_status,
    potentialValue: extractPotentialValueEur(w),
    lastActionAt: Number.isFinite(lastMs) ? new Date(lastMs).toISOString() : null,
    daysSinceLastAction: daysSince,
    priorityScore: score,
  };
}

export function estimateImpactEuro(workflows: WorkflowScopedListRow[]): number {
  let sum = 0;
  for (const w of workflows) {
    const p = extractPotentialValueEur(w);
    const st = w.workflow_status as CeeWorkflowStatus;
    const fallback = DEFAULT_IMPACT_EURO_BY_STATUS[st] ?? 5_500;
    sum += p != null && p > 0 ? p : fallback;
  }
  return Math.round(sum);
}

export function deriveCockpitAlertPriorityLevel(
  severity: CockpitAlertSeverity,
  impact: number | null,
  count: number,
  avgTopScore: number,
): CockpitAlertPriorityLevel {
  const heavyImpact = impact != null && impact >= 45_000;
  const heavyVolume = count >= 22;
  const hotTop = avgTopScore >= 78;

  if (severity === "critical" && (heavyImpact || heavyVolume || hotTop)) return "urgent";
  if (severity === "critical") return "high";
  if (severity === "warning" && (heavyImpact || count >= 14 || hotTop)) return "high";
  if (severity === "warning") return "medium";
  return "low";
}

const TOP_DEFAULT = 5;

export function buildPeriodAlertExecution(
  scopedRows: WorkflowScopedListRow[],
  pick: (w: WorkflowScopedListRow) => boolean,
  now: Date,
  cta: CockpitAlertCta,
  topLimit: number = TOP_DEFAULT,
): {
  topWorkflows: CockpitAlertTopWorkflow[];
  workflowsCount: number;
  estimatedImpactEuro: number | null;
  cta: CockpitAlertCta;
} {
  const candidates = scopedRows.filter(pick);
  const ctx: WorkflowPriorityContext = { nowMs: now.getTime() };
  const sorted = sortWorkflowsByPriority(candidates, ctx);
  const top = sorted.slice(0, topLimit).map((w) => workflowToTopItem(w, computeWorkflowPriorityScore(w, ctx), ctx));
  return {
    topWorkflows: top,
    workflowsCount: candidates.length,
    estimatedImpactEuro: candidates.length ? estimateImpactEuro(candidates) : null,
    cta,
  };
}

export function emptyAlertExecution(
  cta: CockpitAlertCta,
): {
  topWorkflows: CockpitAlertTopWorkflow[];
  workflowsCount: number;
  estimatedImpactEuro: number | null;
  cta: CockpitAlertCta;
} {
  return {
    topWorkflows: [],
    workflowsCount: 0,
    estimatedImpactEuro: null,
    cta,
  };
}
