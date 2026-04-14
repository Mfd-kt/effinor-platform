import type { CeeWorkflowStatus } from "@/features/cee-workflows/domain/constants";
import { buildCloserQueuePath } from "@/features/cee-workflows/lib/closer-paths";
import { buildConfirmateurQueuePath } from "@/features/cee-workflows/lib/confirmateur-paths";
import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";
import type { CockpitVariant } from "@/lib/auth/cockpit-variant";
import type {
  CockpitAlert,
  CockpitAlertAudienceRole,
  CockpitAlertCategory,
  CockpitAlertInput,
  CockpitAlertPriorityLevel,
  CockpitAlertSeverity,
  CockpitAlertTargetType,
  CockpitFunnelCounts,
  CockpitScopeFilters,
  CockpitTeamRollup,
  CockpitWorkflowSnapshot,
} from "@/features/dashboard/domain/cockpit";
import {
  activityDropSeverity,
  isBacklogCritical,
  isRateBelowThreshold,
  lossRateJumpSeverity,
  relativeDropPct,
} from "@/features/dashboard/lib/cockpit-alert-helpers";
import { COCKPIT_ALERT_THRESHOLDS as T } from "@/features/dashboard/lib/cockpit-alert-thresholds";
import { conversionRate } from "@/features/dashboard/lib/cockpit-aggregates";
import {
  buildPeriodAlertExecution,
  deriveCockpitAlertPriorityLevel,
  emptyAlertExecution,
} from "@/features/dashboard/lib/cockpit-workflow-priority";

const MS_DAY = 86_400_000;

const ALERT_LEVEL_SORT_BOOST: Record<CockpitAlertPriorityLevel, number> = {
  urgent: 110,
  high: 55,
  medium: 18,
  low: 0,
};

const SEVERITY_WEIGHT: Record<CockpitAlertSeverity, number> = {
  critical: 1000,
  warning: 520,
  info: 140,
};

const CATEGORY_WEIGHT: Record<CockpitAlertCategory, number> = {
  loss: 86,
  configuration: 78,
  backlog: 74,
  conversion: 70,
  followup: 66,
  staffing: 62,
  documentation: 58,
  activity: 52,
  funnel: 46,
  quality: 42,
};

const TARGET_WEIGHT: Record<CockpitAlertTargetType, number> = {
  user: 28,
  sheet: 24,
  team: 22,
  call_center: 16,
  global: 10,
};

const SEV_ORDER: Record<CockpitAlertSeverity, number> = { critical: 3, warning: 2, info: 1 };

function qualString(q: unknown, key: string): string | null {
  if (!q || typeof q !== "object" || Array.isArray(q)) return null;
  const v = (q as Record<string, unknown>)[key];
  return typeof v === "string" && v.trim() ? v : null;
}

export function computeCockpitAlertPriorityScore(a: CockpitAlertInput): number {
  const countBoost = Math.min(36, Math.floor((a.count ?? a.metricValue ?? 0) / 3));
  return (
    SEVERITY_WEIGHT[a.severity] +
    CATEGORY_WEIGHT[a.category] +
    TARGET_WEIGHT[a.targetType] +
    countBoost
  );
}

export function finalizeCockpitAlert(input: CockpitAlertInput): CockpitAlert {
  const topWorkflows = input.topWorkflows ?? [];
  const workflowsCount = input.workflowsCount ?? input.count ?? topWorkflows.length;
  const estimatedImpactEuro = input.estimatedImpactEuro !== undefined ? input.estimatedImpactEuro : null;
  const avgTopScore = topWorkflows.length
    ? topWorkflows.reduce((s, w) => s + w.priorityScore, 0) / topWorkflows.length
    : 0;
  const priorityLevel =
    input.priorityLevel ??
    deriveCockpitAlertPriorityLevel(input.severity, estimatedImpactEuro, workflowsCount, avgTopScore);
  const cta =
    input.cta ??
    (input.href
      ? { label: "Voir le détail", href: input.href }
      : { label: "Accéder", href: "/" });
  const href = input.href ?? cta.href;
  const basePriority = computeCockpitAlertPriorityScore(input);
  const priorityScore = basePriority + ALERT_LEVEL_SORT_BOOST[priorityLevel];
  const sortScore = priorityScore;
  return {
    ...input,
    href,
    description: input.message,
    topWorkflows,
    workflowsCount,
    estimatedImpactEuro,
    priorityLevel,
    cta,
    priorityScore,
    sortScore,
  };
}

export function sortCockpitAlerts(alerts: CockpitAlert[]): CockpitAlert[] {
  return [...alerts].sort((a, b) => {
    if (b.sortScore !== a.sortScore) return b.sortScore - a.sortScore;
    if (SEV_ORDER[b.severity] !== SEV_ORDER[a.severity]) return SEV_ORDER[b.severity] - SEV_ORDER[a.severity];
    return a.id.localeCompare(b.id);
  });
}

export type ManagerCockpitScope = {
  userId: string;
  teamIds: Set<string>;
  sheetIds: Set<string>;
};

export function filterCockpitAlertsForVariant(
  alerts: CockpitAlert[],
  variant: CockpitVariant,
  managerScope?: ManagerCockpitScope,
): CockpitAlert[] {
  if (variant === "default") return [];

  return alerts.filter((a) => {
    const aud = a.roleAudience;
    const audienceOk =
      aud.includes("all") ||
      aud.includes(variant as CockpitAlertAudienceRole) ||
      (variant === "super_admin" && aud.includes("admin"));

    if (!audienceOk) return false;

    if (variant === "manager" && managerScope) {
      if (a.targetType === "sheet" && a.targetId && !managerScope.sheetIds.has(a.targetId)) {
        return false;
      }
      if (a.targetType === "team" && a.targetId && !managerScope.teamIds.has(a.targetId)) {
        return false;
      }
      if (a.targetType === "user" && a.targetId && a.targetId !== managerScope.userId) {
        return false;
      }
    }

    return true;
  });
}

export type PeriodAlertBuildContext = {
  filters: CockpitScopeFilters;
  periodLabel: string;
  snapshot: CockpitWorkflowSnapshot;
  snapshotPrevious: CockpitWorkflowSnapshot;
  scopedPeriodRows: WorkflowScopedListRow[];
  scopedPreviousRows: WorkflowScopedListRow[];
  leadsCreatedCurrent: number;
  leadsCreatedPrevious: number;
  basePath: string;
  now: Date;
  userId: string;
};

export type StructuralNetworkInput = {
  basePath: string;
  sheets: Array<{
    id: string;
    code: string;
    label: string;
    simulatorKey: string | null;
    workflowKey: string | null;
    presentationTemplateKey: string | null;
    agreementTemplateKey: string | null;
    isCommercialActive: boolean;
  }>;
  teams: Array<{ id: string; name: string; ceeSheetId: string; isActive: boolean }>;
  members: Array<{ ceeSheetTeamId: string; roleInTeam: string; isActive: boolean }>;
};

const CONFIRM_BACKLOG_STATUSES = new Set<CeeWorkflowStatus>(["simulation_done", "to_confirm"]);

function funnelSignedCount(f: CockpitFunnelCounts): number {
  return f.agreement_signed + f.paid + f.quote_signed;
}

function funnelSignRate(f: CockpitFunnelCounts): { rate: number | null; denom: number } {
  const signed = funnelSignedCount(f);
  const sent = f.agreement_sent;
  const denom = sent + signed;
  if (denom < T.conversion.minWorkflowsForSignRate) return { rate: null, denom };
  return { rate: signed / denom, denom };
}

function funnelLossRate(f: CockpitFunnelCounts): number | null {
  if (f.total < T.loss.minWorkflowsForLossRate) return null;
  return f.lost / f.total;
}

function pipelineNonDraftCount(rows: WorkflowScopedListRow[]): number {
  return rows.filter((r) => r.workflow_status !== "draft").length;
}

function sheetSignRate(sr: CockpitWorkflowSnapshot["bySheet"][0]): {
  rate: number | null;
  denom: number;
} {
  const signed = sr.signed;
  const sent = sr.sent;
  const denom = sent + signed;
  if (denom < T.conversion.minWorkflowsForSignRate) return { rate: null, denom };
  return { rate: signed / denom, denom };
}

function teamRollupSignRate(tr: CockpitTeamRollup): { rate: number | null; denom: number } {
  const bys = tr.byStatus;
  const signed =
    (bys.agreement_signed ?? 0) + (bys.paid ?? 0) + (bys.quote_signed ?? 0);
  const sent = bys.agreement_sent ?? 0;
  const denom = sent + signed;
  if (denom < T.conversion.minWorkflowsForSignRate) return { rate: null, denom };
  return { rate: signed / denom, denom };
}

function groupCountConfirmBacklog(
  rows: WorkflowScopedListRow[],
): { global: number; bySheet: Map<string, { label: string; count: number }>; byTeam: Map<string, number> } {
  const bySheet = new Map<string, { label: string; count: number }>();
  const byTeam = new Map<string, number>();
  let global = 0;
  for (const w of rows) {
    const st = w.workflow_status as CeeWorkflowStatus;
    if (!CONFIRM_BACKLOG_STATUSES.has(st)) continue;
    global += 1;
    const sid = w.cee_sheet_id;
    const slab = w.cee_sheet?.label?.trim() || w.cee_sheet?.code || sid;
    const cur = bySheet.get(sid) ?? { label: slab, count: 0 };
    cur.count += 1;
    bySheet.set(sid, cur);
    const tid = w.cee_sheet_team_id;
    if (tid) byTeam.set(tid, (byTeam.get(tid) ?? 0) + 1);
  }
  return { global, bySheet, byTeam };
}

function countStaleConfirm(rows: WorkflowScopedListRow[], nowMs: number, days: number): number {
  const limit = days * MS_DAY;
  let n = 0;
  for (const w of rows) {
    const st = w.workflow_status as CeeWorkflowStatus;
    if (!CONFIRM_BACKLOG_STATUSES.has(st)) continue;
    const updated = new Date(w.updated_at).getTime();
    if (nowMs - updated > limit) n += 1;
  }
  return n;
}

function countDocsPrepared(rows: WorkflowScopedListRow[]): number {
  return rows.filter((r) => r.workflow_status === "docs_prepared").length;
}

function countStaleDocsPrepared(rows: WorkflowScopedListRow[], nowMs: number, days: number): number {
  const limit = days * MS_DAY;
  return rows.filter((r) => {
    if (r.workflow_status !== "docs_prepared") return false;
    return nowMs - new Date(r.updated_at).getTime() > limit;
  }).length;
}

function countAgreementSentOpen(rows: WorkflowScopedListRow[]): number {
  return rows.filter((r) => r.workflow_status === "agreement_sent").length;
}

function countStaleAgreementSent(rows: WorkflowScopedListRow[], nowMs: number, days: number): number {
  const limit = days * MS_DAY;
  return rows.filter((r) => {
    if (r.workflow_status !== "agreement_sent") return false;
    const t = r.agreement_sent_at ? new Date(r.agreement_sent_at).getTime() : new Date(r.updated_at).getTime();
    return nowMs - t > limit;
  }).length;
}

function countFollowUpsOverdue(rows: WorkflowScopedListRow[], nowMs: number): number {
  let n = 0;
  for (const w of rows) {
    if (w.workflow_status !== "agreement_sent") continue;
    const raw = qualString(w.qualification_data_json, "next_follow_up_at");
    if (!raw) continue;
    const t = new Date(raw).getTime();
    if (!Number.isFinite(t)) continue;
    if (t < nowMs) n += 1;
  }
  return n;
}

function countFollowUpsOverdueForUser(rows: WorkflowScopedListRow[], userId: string, nowMs: number): number {
  let n = 0;
  for (const w of rows) {
    if (w.assigned_closer_user_id !== userId) continue;
    if (w.workflow_status !== "agreement_sent") continue;
    const raw = qualString(w.qualification_data_json, "next_follow_up_at");
    if (!raw) continue;
    const t = new Date(raw).getTime();
    if (!Number.isFinite(t)) continue;
    if (t < nowMs) n += 1;
  }
  return n;
}

function countCallbacksOverdueForAgent(rows: WorkflowScopedListRow[], userId: string, nowMs: number): number {
  let n = 0;
  for (const w of rows) {
    if (w.assigned_agent_user_id !== userId) continue;
    const cb = w.lead?.callback_at;
    if (!cb) continue;
    const t = new Date(cb).getTime();
    if (!Number.isFinite(t)) continue;
    if (t < nowMs) n += 1;
  }
  return n;
}

function countWorkflowsForAgent(rows: WorkflowScopedListRow[], userId: string): number {
  return rows.filter((w) => w.assigned_agent_user_id === userId).length;
}

const AUD_ADMIN: CockpitAlertAudienceRole[] = ["super_admin", "admin", "sales_director", "manager"];
const AUD_SIGN_ROLLUP: CockpitAlertAudienceRole[] = [
  "super_admin",
  "admin",
  "sales_director",
  "manager",
  "closer",
];
const AUD_LOSS: CockpitAlertAudienceRole[] = [
  "super_admin",
  "admin",
  "sales_director",
  "manager",
  "closer",
  "confirmer",
];
const AUD_CONF: CockpitAlertAudienceRole[] = [
  "super_admin",
  "admin",
  "sales_director",
  "manager",
  "confirmer",
];
const AUD_CLOSER: CockpitAlertAudienceRole[] = [
  "super_admin",
  "admin",
  "sales_director",
  "manager",
  "closer",
];
const AUD_OPS: CockpitAlertAudienceRole[] = [
  "super_admin",
  "admin",
  "sales_director",
  "manager",
  "confirmer",
  "closer",
];
const AUD_ALL_BUSINESS: CockpitAlertAudienceRole[] = [
  "super_admin",
  "admin",
  "sales_director",
  "manager",
  "confirmer",
  "closer",
  "sales_agent",
];

export function buildPeriodBusinessAlerts(ctx: PeriodAlertBuildContext): CockpitAlert[] {
  const alerts: CockpitAlert[] = [];
  const base = ctx.basePath;
  const nowMs = ctx.now.getTime();
  const xp = (pick: (w: WorkflowScopedListRow) => boolean, ctaLabel: string, href: string) =>
    buildPeriodAlertExecution(ctx.scopedPeriodRows, pick, ctx.now, { label: ctaLabel, href }, 5);
  const { funnel, priorityQueues, bySheet, byTeam, byChannel } = ctx.snapshot;
  const fPrev = ctx.snapshotPrevious.funnel;
  const channelPrev = new Map(ctx.snapshotPrevious.byChannel.map((c) => [c.channel, c.workflowCount] as const));

  const backlog = groupCountConfirmBacklog(ctx.scopedPeriodRows);
  const sevGlobal = isBacklogCritical(
    backlog.global,
    T.backlog.pendingGlobalWarning,
    T.backlog.pendingGlobalCritical,
  );
  if (sevGlobal !== "ok") {
    alerts.push(
      finalizeCockpitAlert({
        id: "period-backlog-confirm-global",
        scope: "period",
        severity: sevGlobal === "critical" ? "critical" : "warning",
        category: "backlog",
        title: "Stock confirmateur élevé",
        message: `${backlog.global} dossier(s) simulé(s) ou à confirmer sur la période — risque de saturation file confirmateur.`,
        suggestedAction: "Prioriser la qualification / confirmation, réaffecter si besoin.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: backlog.global,
        thresholdValue: T.backlog.pendingGlobalWarning,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_CONF,
        href: `${base}${buildConfirmateurQueuePath(null, { tab: "pending" })}`,
        count: backlog.global,
        relatedQueueKey: "blockedConfirm",
        ...xp(
          (w) => CONFIRM_BACKLOG_STATUSES.has(w.workflow_status as CeeWorkflowStatus),
          "Analyser le backlog confirmateur",
          `${base}${buildConfirmateurQueuePath(null, { tab: "pending" })}`,
        ),
      }),
    );
  }

  for (const [sheetId, { label, count }] of backlog.bySheet) {
    const sev = isBacklogCritical(count, T.backlog.pendingPerSheetWarning, T.backlog.pendingPerSheetCritical);
    if (sev === "ok") continue;
    alerts.push(
      finalizeCockpitAlert({
        id: `period-backlog-confirm-sheet-${sheetId}`,
        scope: "period",
        severity: sev === "critical" ? "critical" : "warning",
        category: "backlog",
        title: `Backlog confirmateur — ${label}`,
        message: `${count} dossier(s) en attente côté confirmateur sur cette fiche.`,
        suggestedAction: "Délester la file confirmateur pour cette fiche (créneaux, renfort, reprise des brouillons).",
        targetType: "sheet",
        targetId: sheetId,
        targetLabel: label,
        metricValue: count,
        thresholdValue: T.backlog.pendingPerSheetWarning,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_CONF,
        href: `${base}${buildConfirmateurQueuePath(sheetId, { tab: "pending" })}`,
        count,
        relatedQueueKey: "blockedConfirm",
        ...xp(
          (w) =>
            CONFIRM_BACKLOG_STATUSES.has(w.workflow_status as CeeWorkflowStatus) &&
            w.cee_sheet_id === sheetId,
          "Traiter les dossiers de cette fiche",
          `${base}${buildConfirmateurQueuePath(sheetId, { tab: "pending" })}`,
        ),
      }),
    );
  }

  for (const [teamId, count] of backlog.byTeam) {
    const sev = isBacklogCritical(count, T.backlog.pendingPerTeamWarning, T.backlog.pendingPerTeamCritical);
    if (sev === "ok") continue;
    const tr = byTeam.find((t) => t.teamId === teamId);
    const tlabel = tr?.teamName ?? teamId;
    alerts.push(
      finalizeCockpitAlert({
        id: `period-backlog-confirm-team-${teamId}`,
        scope: "period",
        severity: sev === "critical" ? "critical" : "warning",
        category: "backlog",
        title: `Backlog confirmateur — équipe`,
        message: `${count} dossier(s) à traiter pour l’équipe « ${tlabel} ».`,
        suggestedAction: "Coordonner confirmateur / manager d’équipe pour absorber le stock.",
        targetType: "team",
        targetId: teamId,
        targetLabel: tlabel,
        metricValue: count,
        thresholdValue: T.backlog.pendingPerTeamWarning,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_CONF,
        href: `${base}${buildConfirmateurQueuePath(null, { tab: "pending" })}`,
        count,
        relatedQueueKey: "blockedConfirm",
        ...xp(
          (w) =>
            CONFIRM_BACKLOG_STATUSES.has(w.workflow_status as CeeWorkflowStatus) &&
            w.cee_sheet_team_id === teamId,
          "Voir le stock de l’équipe",
          `${base}${buildConfirmateurQueuePath(null, { tab: "pending" })}`,
        ),
      }),
    );
  }

  const staleConfirmW = countStaleConfirm(ctx.scopedPeriodRows, nowMs, T.backlog.confirmStaleDaysWarning);
  const staleConfirmC = countStaleConfirm(ctx.scopedPeriodRows, nowMs, T.backlog.confirmStaleDaysCritical);
  if (staleConfirmC > 0) {
    alerts.push(
      finalizeCockpitAlert({
        id: "period-confirm-stale-critical",
        scope: "period",
        severity: "critical",
        category: "backlog",
        title: "Dossiers confirmateur trop anciens",
        message: `${staleConfirmC} dossier(s) simulés ou à confirmer sans mise à jour depuis plus de ${T.backlog.confirmStaleDaysCritical} jours.`,
        suggestedAction: "Traiter ou requalifier en priorité — risque de perte commerciale.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: staleConfirmC,
        thresholdValue: T.backlog.confirmStaleDaysCritical,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_CONF,
        href: `${base}${buildConfirmateurQueuePath(null, { tab: "pending" })}`,
        count: staleConfirmC,
        relatedQueueKey: "blockedConfirm",
        ...xp(
          (w) => {
            if (!CONFIRM_BACKLOG_STATUSES.has(w.workflow_status as CeeWorkflowStatus)) return false;
            return nowMs - new Date(w.updated_at).getTime() > T.backlog.confirmStaleDaysCritical * MS_DAY;
          },
          "Traiter les dossiers les plus anciens",
          `${base}${buildConfirmateurQueuePath(null, { tab: "pending" })}`,
        ),
      }),
    );
  } else if (staleConfirmW > 0) {
    alerts.push(
      finalizeCockpitAlert({
        id: "period-confirm-stale-warning",
        scope: "period",
        severity: "warning",
        category: "backlog",
        title: "Confirmations qui traînent",
        message: `${staleConfirmW} dossier(s) sans activité depuis plus de ${T.backlog.confirmStaleDaysWarning} jours.`,
        suggestedAction: "Accélérer la reprise confirmateur.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: staleConfirmW,
        thresholdValue: T.backlog.confirmStaleDaysWarning,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_CONF,
        href: `${base}${buildConfirmateurQueuePath(null, { tab: "pending" })}`,
        count: staleConfirmW,
        relatedQueueKey: "blockedConfirm",
        ...xp(
          (w) => {
            if (!CONFIRM_BACKLOG_STATUSES.has(w.workflow_status as CeeWorkflowStatus)) return false;
            return nowMs - new Date(w.updated_at).getTime() > T.backlog.confirmStaleDaysWarning * MS_DAY;
          },
          "Reprendre la file confirmateur",
          `${base}${buildConfirmateurQueuePath(null, { tab: "pending" })}`,
        ),
      }),
    );
  }

  const docsN = countDocsPrepared(ctx.scopedPeriodRows);
  const docsStaleW = countStaleDocsPrepared(ctx.scopedPeriodRows, nowMs, T.docs.docsPreparedStaleDaysWarning);
  const docsStaleC = countStaleDocsPrepared(ctx.scopedPeriodRows, nowMs, T.docs.docsPreparedStaleDaysCritical);
  const docsSev = isBacklogCritical(docsN, T.docs.docsPreparedBacklogWarning, T.docs.docsPreparedBacklogCritical);
  if (docsSev !== "ok") {
    alerts.push(
      finalizeCockpitAlert({
        id: "period-docs-prepared-stock",
        scope: "period",
        severity: docsSev === "critical" ? "critical" : "warning",
        category: "documentation",
        title: "Stock « docs prêts » élevé",
        message: `${docsN} dossier(s) en docs préparés — risque de blocage avant transmission closer.`,
        suggestedAction: "Transmettre au closer ou finaliser les derniers points documentaires.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: docsN,
        thresholdValue: T.docs.docsPreparedBacklogWarning,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_OPS,
        href: `${base}${buildConfirmateurQueuePath(null, { tab: "docsReady" })}`,
        count: docsN,
        relatedQueueKey: "docsPreparedStale",
        ...xp(
          (w) => w.workflow_status === "docs_prepared",
          "Transmettre au closer",
          `${base}${buildConfirmateurQueuePath(null, { tab: "docsReady" })}`,
        ),
      }),
    );
  }
  if (docsStaleC > 0) {
    alerts.push(
      finalizeCockpitAlert({
        id: "period-docs-stale-critical",
        scope: "period",
        severity: "critical",
        category: "documentation",
        title: "Docs prêts non transmis (délai)",
        message: `${docsStaleC} dossier(s) en docs préparés depuis plus de ${T.docs.docsPreparedStaleDaysCritical} jours.`,
        suggestedAction: "Envoyer au closer ou rouvrir la qualification si bloqué.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: docsStaleC,
        thresholdValue: T.docs.docsPreparedStaleDaysCritical,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_OPS,
        href: `${base}${buildConfirmateurQueuePath(null, { tab: "docsReady" })}`,
        count: docsStaleC,
        relatedQueueKey: "docsPreparedStale",
        ...xp(
          (w) =>
            w.workflow_status === "docs_prepared" &&
            nowMs - new Date(w.updated_at).getTime() > T.docs.docsPreparedStaleDaysCritical * MS_DAY,
          "Débloquer les docs en retard",
          `${base}${buildConfirmateurQueuePath(null, { tab: "docsReady" })}`,
        ),
      }),
    );
  } else if (docsStaleW > 0) {
    alerts.push(
      finalizeCockpitAlert({
        id: "period-docs-stale-warning",
        scope: "period",
        severity: "warning",
        category: "documentation",
        title: "Docs prêts qui attendent",
        message: `${docsStaleW} dossier(s) sans transmission depuis plus de ${T.docs.docsPreparedStaleDaysWarning} jours.`,
        suggestedAction: "Contrôler la file confirmateur → closer.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: docsStaleW,
        thresholdValue: T.docs.docsPreparedStaleDaysWarning,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_OPS,
        href: `${base}${buildConfirmateurQueuePath(null, { tab: "docsReady" })}`,
        count: docsStaleW,
        relatedQueueKey: "docsPreparedStale",
        ...xp(
          (w) =>
            w.workflow_status === "docs_prepared" &&
            nowMs - new Date(w.updated_at).getTime() > T.docs.docsPreparedStaleDaysWarning * MS_DAY,
          "Accélérer la transmission",
          `${base}${buildConfirmateurQueuePath(null, { tab: "docsReady" })}`,
        ),
      }),
    );
  }

  const agrN = countAgreementSentOpen(ctx.scopedPeriodRows);
  const agrSev = isBacklogCritical(agrN, T.closer.agreementSentStockWarning, T.closer.agreementSentStockCritical);
  if (agrSev !== "ok") {
    alerts.push(
      finalizeCockpitAlert({
        id: "period-agreement-sent-stock",
        scope: "period",
        severity: agrSev === "critical" ? "critical" : "warning",
        category: "funnel",
        title: "Stock d’accords envoyés élevé",
        message: `${agrN} accord(s) en attente de signature sur la période — pression sur le closer.`,
        suggestedAction: "Planifier relances ciblées et revue des objections.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: agrN,
        thresholdValue: T.closer.agreementSentStockWarning,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_CLOSER,
        href: `${base}${buildCloserQueuePath(null, { tab: "waitingSignature" })}`,
        count: agrN,
        relatedQueueKey: "agreementsAwaitingSign",
        ...xp(
          (w) => w.workflow_status === "agreement_sent",
          "Prioriser les signatures",
          `${base}${buildCloserQueuePath(null, { tab: "waitingSignature" })}`,
        ),
      }),
    );
  }

  const agrStaleW = countStaleAgreementSent(ctx.scopedPeriodRows, nowMs, T.closer.agreementSentStaleDaysWarning);
  const agrStaleC = countStaleAgreementSent(ctx.scopedPeriodRows, nowMs, T.closer.agreementSentStaleDaysCritical);
  if (agrStaleC > 0) {
    alerts.push(
      finalizeCockpitAlert({
        id: "period-agreement-stale-critical",
        scope: "period",
        severity: "critical",
        category: "followup",
        title: "Accords envoyés sans signature (délai)",
        message: `${agrStaleC} dossier(s) avec accord envoyé depuis plus de ${T.closer.agreementSentStaleDaysCritical} jours.`,
        suggestedAction: "Relances prioritaires closer — risque de perte ou d’image.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: agrStaleC,
        thresholdValue: T.closer.agreementSentStaleDaysCritical,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_CLOSER,
        href: `${base}${buildCloserQueuePath(null, { tab: "followUps" })}`,
        count: agrStaleC,
        relatedQueueKey: "oldAgreementSent",
        ...xp(
          (w) => {
            if (w.workflow_status !== "agreement_sent") return false;
            const t = w.agreement_sent_at
              ? new Date(w.agreement_sent_at).getTime()
              : new Date(w.updated_at).getTime();
            return nowMs - t > T.closer.agreementSentStaleDaysCritical * MS_DAY;
          },
          "Traiter les relances urgentes",
          `${base}${buildCloserQueuePath(null, { tab: "followUps" })}`,
        ),
      }),
    );
  } else if (agrStaleW > 0) {
    alerts.push(
      finalizeCockpitAlert({
        id: "period-agreement-stale-warning",
        scope: "period",
        severity: "warning",
        category: "followup",
        title: "Accords à relancer",
        message: `${agrStaleW} dossier(s) sans signature depuis plus de ${T.closer.agreementSentStaleDaysWarning} jours.`,
        suggestedAction: "Enchaîner appels / relances structurées.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: agrStaleW,
        thresholdValue: T.closer.agreementSentStaleDaysWarning,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_CLOSER,
        href: `${base}${buildCloserQueuePath(null, { tab: "followUps" })}`,
        count: agrStaleW,
        relatedQueueKey: "oldAgreementSent",
        ...xp(
          (w) => {
            if (w.workflow_status !== "agreement_sent") return false;
            const t = w.agreement_sent_at
              ? new Date(w.agreement_sent_at).getTime()
              : new Date(w.updated_at).getTime();
            return nowMs - t > T.closer.agreementSentStaleDaysWarning * MS_DAY;
          },
          "Voir les relances",
          `${base}${buildCloserQueuePath(null, { tab: "followUps" })}`,
        ),
      }),
    );
  }

  if (priorityQueues.oldAgreementSent.length > 0) {
    const oldIds = new Set(priorityQueues.oldAgreementSent.map((x) => x.workflowId));
    alerts.push(
      finalizeCockpitAlert({
        id: "period-old-agreements-queue",
        scope: "period",
        severity: "critical",
        category: "followup",
        title: "File prioritaire — accords à relancer",
        message: `${priorityQueues.oldAgreementSent.length} dossier(s) en tête de liste (accord envoyé ancien).`,
        suggestedAction: "Traiter la file closer « Accords à relancer ».",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: priorityQueues.oldAgreementSent.length,
        thresholdValue: null,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_CLOSER,
        href: `${base}${buildCloserQueuePath(null, { tab: "followUps" })}`,
        count: priorityQueues.oldAgreementSent.length,
        relatedQueueKey: "oldAgreementSent",
        ...xp(
          (w) => oldIds.has(w.id),
          "Ouvrir la file relances",
          `${base}${buildCloserQueuePath(null, { tab: "followUps" })}`,
        ),
      }),
    );
  }

  const { rate: signRate, denom: signDenom } = funnelSignRate(funnel);
  const signSev = isRateBelowThreshold(
    signRate,
    T.conversion.signRateWarning,
    T.conversion.signRateCritical,
  );
  if (signRate != null && signSev !== "ok") {
    const pct =
      conversionRate(funnelSignedCount(funnel), funnel.agreement_sent + funnelSignedCount(funnel)) ??
      Math.round(signRate * 1000) / 10;
    alerts.push(
      finalizeCockpitAlert({
        id: "period-sign-rate-global",
        scope: "period",
        severity: signSev === "critical" ? "critical" : "warning",
        category: "conversion",
        title: "Taux de signature faible",
        message: `Taux signature (signés / (envoyés + signés)) : ${pct} % — ${signDenom} dossiers concernés.`,
        suggestedAction: "Analyser qualité des dossiers closés, objections et délais de relance.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: signRate,
        thresholdValue: T.conversion.signRateWarning,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_SIGN_ROLLUP,
        href: `${base}${buildCloserQueuePath(null, { tab: "waitingSignature" })}`,
        count: signDenom,
        ...xp(
          (w) => w.workflow_status === "agreement_sent",
          "Booster les signatures en cours",
          `${base}${buildCloserQueuePath(null, { tab: "waitingSignature" })}`,
        ),
      }),
    );
  }

  for (const sr of bySheet) {
    const { rate, denom } = sheetSignRate(sr);
    if (rate == null) continue;
    const sev = isRateBelowThreshold(rate, T.conversion.signRateWarning, T.conversion.signRateCritical);
    if (sev === "ok") continue;
    alerts.push(
      finalizeCockpitAlert({
        id: `period-sign-rate-sheet-${sr.sheetId}`,
        scope: "period",
        severity: sev === "critical" ? "critical" : "warning",
        category: "conversion",
        title: `Signature faible — ${sr.sheetLabel}`,
        message: `Taux de signature sous le seuil sur cette fiche (${denom} dossiers avec accord envoyé ou signé).`,
        suggestedAction: "Coacher l’équipe closer / qualifier mieux en amont.",
        targetType: "sheet",
        targetId: sr.sheetId,
        targetLabel: sr.sheetLabel,
        metricValue: rate,
        thresholdValue: T.conversion.signRateWarning,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_SIGN_ROLLUP,
        href: `${base}${buildCloserQueuePath(sr.sheetId, { tab: "waitingSignature" })}`,
        count: denom,
        ...xp(
          (w) => w.workflow_status === "agreement_sent" && w.cee_sheet_id === sr.sheetId,
          "Dossiers à signer — cette fiche",
          `${base}${buildCloserQueuePath(sr.sheetId, { tab: "waitingSignature" })}`,
        ),
      }),
    );
  }

  for (const tr of byTeam) {
    const { rate, denom } = teamRollupSignRate(tr);
    if (rate == null) continue;
    const sev = isRateBelowThreshold(rate, T.conversion.signRateWarning, T.conversion.signRateCritical);
    if (sev === "ok") continue;
    alerts.push(
      finalizeCockpitAlert({
        id: `period-sign-rate-team-${tr.teamId}`,
        scope: "period",
        severity: sev === "critical" ? "critical" : "warning",
        category: "conversion",
        title: `Signature faible — équipe`,
        message: `Équipe « ${tr.teamName} » : conversion signature sous le seuil (${denom} dossiers).`,
        suggestedAction: "Audit des relances et du discours commercial closer.",
        targetType: "team",
        targetId: tr.teamId,
        targetLabel: tr.teamName,
        metricValue: rate,
        thresholdValue: T.conversion.signRateWarning,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_SIGN_ROLLUP,
        href: `${base}${buildCloserQueuePath(null, { tab: "waitingSignature" })}`,
        count: denom,
        ...xp(
          (w) => w.workflow_status === "agreement_sent" && w.cee_sheet_team_id === tr.teamId,
          "Signatures équipe — action closer",
          `${base}${buildCloserQueuePath(null, { tab: "waitingSignature" })}`,
        ),
      }),
    );
  }

  const lossRate = funnelLossRate(funnel);
  const lossPrev = funnelLossRate(fPrev);
  if (lossRate != null) {
    const highLoss =
      lossRate >= T.loss.lossRateCritical
        ? "critical"
        : lossRate >= T.loss.lossRateWarning
          ? "warning"
          : "ok";

    if (highLoss !== "ok") {
      alerts.push(
        finalizeCockpitAlert({
          id: "period-loss-rate",
          scope: "period",
          severity: highLoss === "critical" ? "critical" : "warning",
          category: "loss",
          title: "Taux de pertes élevé",
          message: `${Math.round(lossRate * 1000) / 10} % des dossiers de la période sont perdus (échantillon ${funnel.total}).`,
          suggestedAction: "Revoir sources, qualification et parcours — atelier pertes par motif.",
          targetType: "global",
          targetId: null,
          targetLabel: null,
          metricValue: lossRate,
          thresholdValue: T.loss.lossRateWarning,
          comparisonValue: lossPrev,
          period: ctx.periodLabel,
          roleAudience: AUD_LOSS,
          href: `${base}/leads`,
          count: funnel.lost,
          ...xp(
            (w) => w.workflow_status === "lost",
            "Analyser les dossiers perdus",
            `${base}/leads`,
          ),
        }),
      );
    }

    const jumpSev = lossRateJumpSeverity(
      lossRate,
      lossPrev,
      T.loss.lossRateJumpWarning,
      T.loss.lossRateJumpCritical,
    );
    if (jumpSev !== "ok" && lossPrev != null) {
      alerts.push(
        finalizeCockpitAlert({
          id: "period-loss-rate-jump",
          scope: "period",
          severity: jumpSev === "critical" ? "critical" : "warning",
          category: "loss",
          title: "Hausse des pertes vs période précédente",
          message: `Taux de perte en hausse par rapport à ${ctx.periodLabel === "Aujourd’hui" ? "hier" : "la fenêtre de comparaison"}.`,
          suggestedAction: "Identifier rapidement les fiches / canaux qui dégradent.",
          targetType: "global",
          targetId: null,
          targetLabel: null,
          metricValue: lossRate,
          thresholdValue: T.loss.lossRateJumpWarning,
          comparisonValue: lossPrev,
          period: ctx.periodLabel,
          roleAudience: AUD_LOSS,
          href: `${base}/leads`,
          ...xp(
            (w) => w.workflow_status === "lost",
            "Voir les pertes récentes",
            `${base}/leads`,
          ),
        }),
      );
    }
  }

  const leadsDrop = activityDropSeverity(
    ctx.leadsCreatedCurrent,
    ctx.leadsCreatedPrevious,
    T.activity.leadsDropWarningPct,
    T.activity.leadsDropCriticalPct,
    T.activity.minLeadsPreviousForDrop,
  );
  if (leadsDrop !== "ok") {
    const dropPct = relativeDropPct(ctx.leadsCreatedCurrent, ctx.leadsCreatedPrevious);
    alerts.push(
      finalizeCockpitAlert({
        id: "period-leads-drop",
        scope: "period",
        severity: leadsDrop === "critical" ? "critical" : "warning",
        category: "activity",
        title: "Baisse des nouveaux leads",
        message:
          dropPct != null
            ? `Volume de leads créés en baisse d’environ ${dropPct} % vs période précédente.`
            : "Volume de leads créés en baisse vs période précédente.",
        suggestedAction: "Réactiver les canaux acquisition et le pilotage centre d’appel.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: ctx.leadsCreatedCurrent,
        thresholdValue: ctx.leadsCreatedPrevious,
        comparisonValue: dropPct,
        period: ctx.periodLabel,
        roleAudience: AUD_ADMIN,
        href: `${base}/leads`,
        ...emptyAlertExecution({
          label: "Ouvrir les fiches prospects",
          href: `${base}/leads`,
        }),
      }),
    );
  }

  const periodDays =
    ctx.filters.period === "today"
      ? 1
      : ctx.filters.period === "week"
        ? 7
        : ctx.filters.period === "month"
          ? 30
          : 30;
  if (periodDays >= T.activity.minPeriodDaysForAbsoluteLow) {
    if (ctx.leadsCreatedCurrent <= T.activity.leadsAbsoluteLowCritical) {
      alerts.push(
        finalizeCockpitAlert({
          id: "period-leads-absolute-low-critical",
          scope: "period",
          severity: "critical",
          category: "activity",
          title:
            ctx.leadsCreatedCurrent === 1
              ? "Seulement 1 lead créé sur la période — relancer la prospection immédiatement"
              : "Très peu de nouveaux leads — relancer la prospection maintenant",
          message: `${ctx.leadsCreatedCurrent} lead(s) créé(s) sur la fenêtre — la pipe cash est trop basse pour tenir les objectifs.`,
          suggestedAction: "Déclencher campagnes, rappels sortants et relance partenaires dès aujourd’hui.",
          targetType: "global",
          targetId: null,
          targetLabel: null,
          metricValue: ctx.leadsCreatedCurrent,
          thresholdValue: T.activity.leadsAbsoluteLowCritical,
          comparisonValue: null,
          period: ctx.periodLabel,
          roleAudience: AUD_ADMIN,
          href: `${base}/leads`,
          ...emptyAlertExecution({
            label: "Voir les prospects",
            href: `${base}/leads`,
          }),
        }),
      );
    } else if (ctx.leadsCreatedCurrent <= T.activity.leadsAbsoluteLowWarning) {
      alerts.push(
        finalizeCockpitAlert({
          id: "period-leads-absolute-low-warning",
          scope: "period",
          severity: "warning",
          category: "activity",
          title: `Volume leads bas (${ctx.leadsCreatedCurrent}) — accélérer l’acquisition cette semaine`,
          message: `Sous le seuil d’alerte : ${ctx.leadsCreatedCurrent} lead(s) sur la période — prioriser canaux et création de rendez-vous.`,
          suggestedAction: "Bloquer un créneau équipe prospection et suivre les KPI quotidiens.",
          targetType: "global",
          targetId: null,
          targetLabel: null,
          metricValue: ctx.leadsCreatedCurrent,
          thresholdValue: T.activity.leadsAbsoluteLowWarning,
          comparisonValue: null,
          period: ctx.periodLabel,
          roleAudience: AUD_ADMIN,
          href: `${base}/leads`,
          ...emptyAlertExecution({
            label: "Voir les prospects",
            href: `${base}/leads`,
          }),
        }),
      );
    }
  }

  const pipeCur = pipelineNonDraftCount(ctx.scopedPeriodRows);
  const pipePrev = pipelineNonDraftCount(ctx.scopedPreviousRows);
  const pipeDrop = activityDropSeverity(
    pipeCur,
    pipePrev,
    T.activity.pipelineDropWarningPct,
    T.activity.pipelineDropCriticalPct,
    T.activity.minPipelinePrevious,
  );
  if (pipeDrop !== "ok") {
    alerts.push(
      finalizeCockpitAlert({
        id: "period-pipeline-drop",
        scope: "period",
        severity: pipeDrop === "critical" ? "critical" : "warning",
        category: "activity",
        title: "Pipeline post-brouillon en baisse",
        message: `Moins de dossiers actifs (hors brouillon) créés sur la période vs la précédente.`,
        suggestedAction: "Accélérer validation simulations et passages confirmateur.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: pipeCur,
        thresholdValue: pipePrev,
        comparisonValue: relativeDropPct(pipeCur, pipePrev),
        period: ctx.periodLabel,
        roleAudience: AUD_ALL_BUSINESS,
        href: `${base}/agent`,
        ...xp(
          (w) => w.workflow_status !== "draft",
          "Réactiver le pipeline",
          `${base}/agent`,
        ),
      }),
    );
  }

  for (const ch of byChannel) {
    if (ch.channel === "—") continue;
    const prevN = channelPrev.get(ch.channel) ?? 0;
    if (prevN < T.channel.minChannelWorkflowsPrev) continue;
    const dropPct = relativeDropPct(ch.workflowCount, prevN);
    if (dropPct == null) continue;
    if (dropPct >= T.channel.volumeDropCriticalPct) {
      alerts.push(
        finalizeCockpitAlert({
          id: `period-channel-volume-drop-${encodeURIComponent(ch.channel)}`,
          scope: "period",
          severity: "critical",
          category: "activity",
          title: `Chute de volume — canal « ${ch.channel} »`,
          message: `Environ ${dropPct} % de dossiers en moins vs période précédente sur ce canal (proxy centre / source).`,
          suggestedAction: "Analyser l’alimentation du canal et la qualité des campagnes.",
          targetType: "call_center",
          targetId: ch.channel,
          targetLabel: ch.channel,
          metricValue: ch.workflowCount,
          thresholdValue: prevN,
          comparisonValue: dropPct,
          period: ctx.periodLabel,
          roleAudience: AUD_ADMIN,
          href: `${base}/leads`,
          ...xp(
            (w) => (w.lead?.lead_channel ?? "—") === ch.channel,
            `Dossiers du canal « ${ch.channel} »`,
            `${base}/leads`,
          ),
        }),
      );
    } else if (dropPct >= T.channel.volumeDropWarningPct) {
      alerts.push(
        finalizeCockpitAlert({
          id: `period-channel-volume-warn-${encodeURIComponent(ch.channel)}`,
          scope: "period",
          severity: "warning",
          category: "activity",
          title: `Activité en baisse — « ${ch.channel} »`,
          message: `Baisse d’environ ${dropPct} % du volume de dossiers vs période précédente.`,
          suggestedAction: "Anticiper sur ce canal avant dérapage commercial.",
          targetType: "call_center",
          targetId: ch.channel,
          targetLabel: ch.channel,
          metricValue: ch.workflowCount,
          thresholdValue: prevN,
          comparisonValue: dropPct,
          period: ctx.periodLabel,
          roleAudience: AUD_ADMIN,
          href: `${base}/leads`,
          ...xp(
            (w) => (w.lead?.lead_channel ?? "—") === ch.channel,
            `Piloter le canal « ${ch.channel} »`,
            `${base}/leads`,
          ),
        }),
      );
    }

    const signedPrev =
      ctx.snapshotPrevious.byChannel.find((c) => c.channel === ch.channel)?.signed ?? 0;
    const rateCur = ch.workflowCount > 0 ? ch.signed / ch.workflowCount : null;
    const ratePrev = prevN > 0 ? signedPrev / prevN : null;
    if (rateCur != null && ratePrev != null && prevN >= T.channel.minChannelWorkflowsPrev) {
      const convDrop = ratePrev - rateCur;
      if (convDrop >= 0.15) {
        alerts.push(
          finalizeCockpitAlert({
            id: `period-channel-conversion-${encodeURIComponent(ch.channel)}`,
            scope: "period",
            severity: convDrop >= 0.25 ? "critical" : "warning",
            category: "conversion",
            title: `Conversion en baisse — « ${ch.channel} »`,
            message: `Part des dossiers signés sur ce canal en baisse vs période précédente.`,
            suggestedAction: "Revoir script et ciblage sur ce flux.",
            targetType: "call_center",
            targetId: ch.channel,
            targetLabel: ch.channel,
            metricValue: rateCur,
            thresholdValue: ratePrev,
            comparisonValue: convDrop,
            period: ctx.periodLabel,
            roleAudience: AUD_ADMIN,
            href: `${base}/leads`,
            ...xp(
              (w) => (w.lead?.lead_channel ?? "—") === ch.channel,
              `Conversion — canal « ${ch.channel} »`,
              `${base}/leads`,
            ),
          }),
        );
      }
    }
  }

  const fuGlobal = countFollowUpsOverdue(ctx.scopedPeriodRows, nowMs);
  const fuSev = isBacklogCritical(
    fuGlobal,
    T.closer.followUpsOverdueWarning,
    T.closer.followUpsOverdueCritical,
  );
  if (fuSev !== "ok") {
    alerts.push(
      finalizeCockpitAlert({
        id: "period-followups-overdue",
        scope: "period",
        severity: fuSev === "critical" ? "critical" : "warning",
        category: "followup",
        title: "Relances closer en retard",
        message: `${fuGlobal} dossier(s) avec date de relance dépassée (accords envoyés).`,
        suggestedAction: "Traiter les rappels dans l’espace closer.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: fuGlobal,
        thresholdValue: T.closer.followUpsOverdueWarning,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_CLOSER,
        href: `${base}${buildCloserQueuePath(null, { tab: "followUps" })}`,
        count: fuGlobal,
        ...xp(
          (w) => {
            if (w.workflow_status !== "agreement_sent") return false;
            const raw = qualString(w.qualification_data_json, "next_follow_up_at");
            if (!raw) return false;
            const t = new Date(raw).getTime();
            return Number.isFinite(t) && t < nowMs;
          },
          "Traiter les relances",
          `${base}${buildCloserQueuePath(null, { tab: "followUps" })}`,
        ),
      }),
    );
  }

  const fuCloser = countFollowUpsOverdueForUser(ctx.scopedPeriodRows, ctx.userId, nowMs);
  if (fuCloser > 0) {
    alerts.push(
      finalizeCockpitAlert({
        id: `period-followups-user-${ctx.userId}`,
        scope: "period",
        severity: fuCloser >= 5 ? "critical" : "warning",
        category: "followup",
        title: "Vos relances sont en retard",
        message: `${fuCloser} dossier(s) vous sont assignés avec relance due.`,
        suggestedAction: "Ouvrir la file closer et traiter les rappels.",
        targetType: "user",
        targetId: ctx.userId,
        targetLabel: "Moi",
        metricValue: fuCloser,
        thresholdValue: null,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: ["closer"],
        href: `${base}${buildCloserQueuePath(null, { tab: "followUps" })}`,
        count: fuCloser,
        ...xp(
          (w) => {
            if (w.assigned_closer_user_id !== ctx.userId) return false;
            if (w.workflow_status !== "agreement_sent") return false;
            const raw = qualString(w.qualification_data_json, "next_follow_up_at");
            if (!raw) return false;
            const t = new Date(raw).getTime();
            return Number.isFinite(t) && t < nowMs;
          },
          "Mes relances en retard",
          `${base}${buildCloserQueuePath(null, { tab: "followUps" })}`,
        ),
      }),
    );
  }

  const cbAgent = countCallbacksOverdueForAgent(ctx.scopedPeriodRows, ctx.userId, nowMs);
  if (cbAgent > 0) {
    alerts.push(
      finalizeCockpitAlert({
        id: `period-callbacks-agent-${ctx.userId}`,
        scope: "period",
        severity: cbAgent >= 4 ? "critical" : "warning",
        category: "followup",
        title: "Rappels prospects en retard",
        message: `${cbAgent} lead(s) avec rappel prévu dépassé sur vos dossiers.`,
        suggestedAction: "Recontacter en priorité ou mettre à jour le lead.",
        targetType: "user",
        targetId: ctx.userId,
        targetLabel: "Moi",
        metricValue: cbAgent,
        thresholdValue: null,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: ["sales_agent"],
        href: `${base}/agent`,
        count: cbAgent,
        ...xp(
          (w) => {
            if (w.assigned_agent_user_id !== ctx.userId) return false;
            const cb = w.lead?.callback_at;
            if (!cb) return false;
            const t = new Date(cb).getTime();
            return Number.isFinite(t) && t < nowMs;
          },
          "Mes rappels à traiter",
          `${base}/agent`,
        ),
      }),
    );
  }

  const agentWf = countWorkflowsForAgent(ctx.scopedPeriodRows, ctx.userId);
  if (agentWf <= 2 && ctx.scopedPeriodRows.length >= 8) {
    alerts.push(
      finalizeCockpitAlert({
        id: `period-agent-low-activity-${ctx.userId}`,
        scope: "period",
        severity: agentWf === 0 ? "warning" : "info",
        category: "activity",
        title: "Activité personnelle faible",
        message: `Peu de dossiers vous sont rattachés sur cette période (${agentWf}).`,
        suggestedAction: "Vérifier l’affectation des leads et la couverture de vos créneaux.",
        targetType: "user",
        targetId: ctx.userId,
        targetLabel: "Moi",
        metricValue: agentWf,
        thresholdValue: 2,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: ["sales_agent"],
        href: `${base}/agent`,
        count: agentWf,
        ...xp(
          (w) => w.assigned_agent_user_id === ctx.userId,
          "Voir mes dossiers",
          `${base}/agent`,
        ),
      }),
    );
  }

  if (priorityQueues.staleDrafts.length > 0) {
    const staleDraftIds = new Set(priorityQueues.staleDrafts.map((x) => x.workflowId));
    alerts.push(
      finalizeCockpitAlert({
        id: "period-stale-drafts",
        scope: "period",
        severity: "warning",
        category: "activity",
        title: "Brouillons inactifs",
        message: `${priorityQueues.staleDrafts.length} brouillon(s) sans mise à jour depuis ${T.draft.staleDraftDays} jours.`,
        suggestedAction: "Relancer les agents ou clôturer les dossiers dormants.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: priorityQueues.staleDrafts.length,
        thresholdValue: T.draft.staleDraftDays,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: ["super_admin", "admin", "sales_director", "manager", "sales_agent"],
        href: `${base}/agent`,
        count: priorityQueues.staleDrafts.length,
        relatedQueueKey: "staleDrafts",
        ...xp(
          (w) => staleDraftIds.has(w.id),
          "Débloquer les brouillons",
          `${base}/agent`,
        ),
      }),
    );
  }

  const sheetsNoFlow = bySheet.filter((s) => s.workflowCount === 0);
  if (bySheet.length > 0 && sheetsNoFlow.length === bySheet.length && funnel.total === 0) {
    alerts.push(
      finalizeCockpitAlert({
        id: "period-no-data",
        scope: "period",
        severity: "info",
        category: "activity",
        title: "Aucun dossier sur la période",
        message: "Élargir la période ou les filtres, ou vérifier l’alimentation des leads.",
        suggestedAction: "Ajuster les filtres cockpit ou contacter l’administration réseau.",
        targetType: "global",
        targetId: null,
        targetLabel: null,
        metricValue: 0,
        thresholdValue: null,
        comparisonValue: null,
        period: ctx.periodLabel,
        roleAudience: AUD_ALL_BUSINESS,
        href: `${base}/`,
        ...emptyAlertExecution({
          label: "Ajuster le cockpit",
          href: `${base}/`,
        }),
      }),
    );
  }

  return sortCockpitAlerts(alerts);
}

export function buildStructuralBusinessAlerts(input: StructuralNetworkInput): CockpitAlert[] {
  const alerts: CockpitAlert[] = [];
  const base = input.basePath;
  const structCta = `${base}/admin/cee-sheets`;
  const structExec = emptyAlertExecution({
    label: "Administration fiches CEE",
    href: structCta,
  });
  const activeTeams = input.teams.filter((t) => t.isActive);
  const teamsBySheet = new Map<string, typeof activeTeams>();
  for (const t of activeTeams) {
    const arr = teamsBySheet.get(t.ceeSheetId) ?? [];
    arr.push(t);
    teamsBySheet.set(t.ceeSheetId, arr);
  }

  const sheetLabel = (id: string) =>
    input.sheets.find((s) => s.id === id)?.label?.trim() ||
    input.sheets.find((s) => s.id === id)?.code ||
    id;

  const activeMembersByTeam = new Map<string, typeof input.members>();
  for (const m of input.members) {
    const arr = activeMembersByTeam.get(m.ceeSheetTeamId) ?? [];
    arr.push(m);
    activeMembersByTeam.set(m.ceeSheetTeamId, arr);
  }

  for (const sheet of input.sheets) {
    const teams = teamsBySheet.get(sheet.id) ?? [];
    if (teams.length === 0) {
      alerts.push(
        finalizeCockpitAlert({
          id: `struct-sheet-no-team-${sheet.id}`,
          scope: "structural",
          severity: "warning",
          category: "staffing",
          title: `Fiche sans équipe active — ${sheet.label}`,
          message: "Aucune équipe commerciale active n’est rattachée à cette fiche.",
          suggestedAction: "Créer ou réactiver une équipe dans l’administration fiches CEE.",
          targetType: "sheet",
          targetId: sheet.id,
          targetLabel: sheet.label,
          metricValue: null,
          thresholdValue: null,
          comparisonValue: null,
          period: null,
          roleAudience: AUD_ADMIN,
          href: structCta,
          count: 1,
          ...structExec,
        }),
      );
    }
  }

  for (const team of activeTeams) {
    const mems = activeMembersByTeam.get(team.id) ?? [];
    const active = mems.filter((m) => m.isActive);
    const roles = new Set(active.map((m) => m.roleInTeam));
    const sheetL = sheetLabel(team.ceeSheetId);

    if (active.length === 0) {
      alerts.push(
        finalizeCockpitAlert({
          id: `struct-team-inactive-members-${team.id}`,
          scope: "structural",
          severity: "critical",
          category: "staffing",
          title: `Équipe sans membre actif — ${team.name}`,
          message: `L’équipe sur « ${sheetL} » n’a aucun membre actif.`,
          suggestedAction: "Réactiver ou affecter des membres (agent, confirmateur, closer).",
          targetType: "team",
          targetId: team.id,
          targetLabel: team.name,
          metricValue: null,
          thresholdValue: null,
          comparisonValue: null,
          period: null,
          roleAudience: AUD_ADMIN,
          href: structCta,
          ...structExec,
        }),
      );
      continue;
    }

    if (!roles.has("closer")) {
      alerts.push(
        finalizeCockpitAlert({
          id: `struct-team-no-closer-${team.id}`,
          scope: "structural",
          severity: "critical",
          category: "staffing",
          title: `Équipe sans closer — ${team.name}`,
          message: `Équipe « ${team.name} » (${sheetL}) : aucun closer actif déclaré.`,
          suggestedAction: "Affecter un closer avant envoi des accords.",
          targetType: "team",
          targetId: team.id,
          targetLabel: team.name,
          metricValue: null,
          thresholdValue: null,
          comparisonValue: null,
          period: null,
          roleAudience: AUD_ADMIN,
          href: structCta,
          ...structExec,
        }),
      );
    }
    if (!roles.has("agent")) {
      alerts.push(
        finalizeCockpitAlert({
          id: `struct-team-no-agent-${team.id}`,
          scope: "structural",
          severity: "warning",
          category: "staffing",
          title: `Équipe sans agent — ${team.name}`,
          message: `Pas d’agent terrain actif sur l’équipe « ${team.name} ».`,
          suggestedAction: "Compléter le staffing pour absorber les leads.",
          targetType: "team",
          targetId: team.id,
          targetLabel: team.name,
          metricValue: null,
          thresholdValue: null,
          comparisonValue: null,
          period: null,
          roleAudience: AUD_ADMIN,
          href: structCta,
          ...structExec,
        }),
      );
    }
    if (!roles.has("confirmateur")) {
      alerts.push(
        finalizeCockpitAlert({
          id: `struct-team-no-conf-${team.id}`,
          scope: "structural",
          severity: "warning",
          category: "staffing",
          title: `Équipe sans confirmateur — ${team.name}`,
          message: `Pas de confirmateur actif — risque de goulot sur la validation.`,
          suggestedAction: "Affecter un confirmateur dédié.",
          targetType: "team",
          targetId: team.id,
          targetLabel: team.name,
          metricValue: null,
          thresholdValue: null,
          comparisonValue: null,
          period: null,
          roleAudience: AUD_ADMIN,
          href: structCta,
          ...structExec,
        }),
      );
    }
    if (T.staffing.warnTeamWithoutManager && !roles.has("manager")) {
      alerts.push(
        finalizeCockpitAlert({
          id: `struct-team-no-manager-${team.id}`,
          scope: "structural",
          severity: "info",
          category: "staffing",
          title: `Équipe sans manager — ${team.name}`,
          message: "Aucun rôle manager actif — pilotage d’équipe affaibli.",
          suggestedAction: "Désigner un manager de proximité.",
          targetType: "team",
          targetId: team.id,
          targetLabel: team.name,
          metricValue: null,
          thresholdValue: null,
          comparisonValue: null,
          period: null,
          roleAudience: AUD_ADMIN,
          href: structCta,
          ...structExec,
        }),
      );
    }
  }

  for (const sheet of input.sheets) {
    if (!sheet.isCommercialActive) continue;
    const missing: string[] = [];
    if (!sheet.simulatorKey?.trim()) missing.push("simulateur");
    if (!sheet.workflowKey?.trim()) missing.push("workflow_key");
    if (!sheet.presentationTemplateKey?.trim()) missing.push("template présentation");
    if (!sheet.agreementTemplateKey?.trim()) missing.push("template accord");
    if (missing.length > 0) {
      alerts.push(
        finalizeCockpitAlert({
          id: `struct-sheet-misconfigured-${sheet.id}`,
          scope: "structural",
          severity: "critical",
          category: "configuration",
          title: `Fiche active incomplète — ${sheet.label}`,
          message: `Éléments manquants : ${missing.join(", ")}.`,
          suggestedAction: "Compléter la configuration dans l’admin fiche avant mise en production.",
          targetType: "sheet",
          targetId: sheet.id,
          targetLabel: sheet.label,
          metricValue: missing.length,
          thresholdValue: null,
          comparisonValue: null,
          period: null,
          roleAudience: ["super_admin", "admin", "sales_director", "manager"],
          href: structCta,
          ...structExec,
        }),
      );
    }
  }

  return sortCockpitAlerts(alerts);
}
