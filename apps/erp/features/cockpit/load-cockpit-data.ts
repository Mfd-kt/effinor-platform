import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import type { AccessContext } from "@/lib/auth/access-context";
import type { CockpitVariant } from "@/lib/auth/cockpit-variant";
import { canAccessCommandCockpit } from "@/lib/auth/module-access";
import { isCeeTeamManager } from "@/features/dashboard/queries/get-managed-teams-context";
import { DEFAULT_COCKPIT_FILTERS } from "@/features/dashboard/domain/cockpit";
import type { CockpitAlert } from "@/features/dashboard/domain/cockpit";
import { buildWorkflowSnapshot } from "@/features/dashboard/lib/cockpit-aggregates";
import { getCockpitBundle } from "@/features/dashboard/queries/get-cockpit-bundle";
import { computeCommercialCallbackScore } from "@/features/commercial-callbacks/lib/callback-scoring";
import {
  computeCallbackPerformanceStats,
  computeCommercialCallbackKpis,
} from "@/features/commercial-callbacks/lib/commercial-callback-metrics";
import { fetchCommercialCallbacksAllVisible } from "@/features/commercial-callbacks/queries/get-commercial-callbacks-for-agent";
import {
  calendarDateInParis,
  isCallbackDueToday,
  isCallbackOverdue,
  isTerminalCallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-dates";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

import { commercialCallbackStatusLabelFr } from "./lib/callback-status-label-fr";
import { generateCockpitAiRecommendations } from "./ai/generate-cockpit-ai-recommendations";
import type { CockpitDataForAi } from "./ai/build-cockpit-ai-context";
import { loadCockpitInternalSlaBlock } from "@/features/internal-sla/sla-reporting";
import { buildHumanAnomalies } from "./lib/build-human-anomalies";
import { mergeCockpitAiExecutionStatuses } from "./queries/merge-cockpit-ai-execution-status";
import { computeCockpitPriority } from "./lib/compute-cockpit-priority";
import { valueCentsCallback } from "./lib/cockpit-value-helpers";
import {
  computeWorkflowLogMetrics,
  type WorkflowEventLogRow,
} from "./lib/workflow-log-metrics";
import type {
  CashImmediateRow,
  CallbackShortRow,
  CockpitAgentPerformanceRow,
  CockpitAiOrchestratorActivity,
  CockpitCloserPerformanceRow,
  CockpitConfirmateurPerformanceRow,
  CommandCockpitAlert,
  CockpitAiRecommendation,
  CommandCockpitData,
  CommandCockpitLogLine,
  HotOpportunityRow,
  AutomationHealthLevel,
} from "./types";

const AUTOMATION_WINDOW_H = 48;
const MAX_ALERTS = 24;
const MAX_OPPORTUNITIES = 18;
const MAX_LOG_LINES = 18;
const MAX_CASH = 10;

const CASH_CALLBACK_STATUSES = new Set(["pending", "due_today", "overdue"]);

function mapCockpitAlert(a: CockpitAlert): CommandCockpitAlert {
  return {
    id: a.id,
    severity: a.severity,
    title: a.title,
    message: a.message,
    href: a.cta.href,
    actionLabel: a.cta.label,
  };
}

function dedupeAlerts(rows: CommandCockpitAlert[]): CommandCockpitAlert[] {
  const seen = new Set<string>();
  const out: CommandCockpitAlert[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}

function sortAlerts(rows: CommandCockpitAlert[]): CommandCockpitAlert[] {
  const rank = { critical: 0, warning: 1, info: 2 } as const;
  return [...rows].sort((a, b) => rank[a.severity] - rank[b.severity]);
}

function leadBusinessScore(simSaving: number | null): number {
  if (simSaving != null && simSaving > 0) {
    return Math.min(100, Math.round(38 + Math.min(simSaving / 900, 58)));
  }
  return 30;
}

function valueCentsLead(simSaving: number | null, install: number | null): number {
  if (install != null && install > 0) return Math.round(install * 100);
  if (simSaving != null && simSaving > 0) return Math.round(simSaving * 100);
  return 0;
}

function avgDaysSinceUpdated(rows: { updated_at: string }[]): number | null {
  if (rows.length === 0) return null;
  const now = Date.now();
  const ms = rows.reduce((s, r) => s + (now - new Date(r.updated_at).getTime()), 0) / rows.length;
  return Math.round((ms / 86_400_000) * 10) / 10;
}

function automationHealth(
  lastHourFails: number,
  failed48: number,
  slackFailed: number,
  emailFailed: number,
): AutomationHealthLevel {
  if (lastHourFails > 0 || slackFailed >= 3 || emailFailed >= 4) return "problem";
  if (failed48 > 0 || slackFailed > 0 || emailFailed > 0) return "partial";
  return "ok";
}

function buildSyntheticAlerts(input: {
  callbackKpis: { overdue: number };
  automationFailed48h: number;
  activeConfirmateurs: number;
  activeClosers: number;
  pendingInitialEmail: number;
  globalSnapshotTotal: number;
  blockedConfirmCount: number;
}): CommandCockpitAlert[] {
  const out: CommandCockpitAlert[] = [];

  if (input.callbackKpis.overdue >= 15) {
    out.push({
      id: "cmd:callbacks-overdue-critical",
      severity: "critical",
      title: "Rappels commerciaux en retard critique",
      message: `${input.callbackKpis.overdue} rappels dépassés — prioriser l’équipe commerciale.`,
      href: "/commercial-callbacks",
      actionLabel: "Ouvrir la file",
    });
  } else if (input.callbackKpis.overdue >= 5) {
    out.push({
      id: "cmd:callbacks-overdue-warn",
      severity: "warning",
      title: "Rappels en retard",
      message: `${input.callbackKpis.overdue} rappels en retard.`,
      href: "/commercial-callbacks",
      actionLabel: "Traiter",
    });
  }

  if (input.automationFailed48h >= 5) {
    out.push({
      id: "cmd:automation-failures",
      severity: "critical",
      title: "Automations en échec",
      message: `${input.automationFailed48h} exécutions en échec sur 48h (cron / emails / Slack).`,
      href: "/cockpit",
      actionLabel: "Voir automations",
    });
  } else if (input.automationFailed48h >= 1) {
    out.push({
      id: "cmd:automation-failures-warn",
      severity: "warning",
      title: "Erreurs d’automation récentes",
      message: `${input.automationFailed48h} échec(s) enregistré(s) sur 48h.`,
      href: "/cockpit",
      actionLabel: "Détails",
    });
  }

  if (input.activeConfirmateurs === 0) {
    out.push({
      id: "cmd:no-confirmateur",
      severity: "critical",
      title: "Aucun confirmateur actif en équipe",
      message: "Aucun membre actif avec le rôle confirmateur sur les équipes CEE.",
      href: "/settings/cee",
      actionLabel: "Réglages CEE",
    });
  }

  if (input.activeClosers === 0) {
    out.push({
      id: "cmd:no-closer",
      severity: "critical",
      title: "Aucun closer actif en équipe",
      message: "Aucun membre actif avec le rôle closer sur les équipes CEE.",
      href: "/settings/cee",
      actionLabel: "Réglages CEE",
    });
  }

  if (input.pendingInitialEmail >= 30) {
    out.push({
      id: "cmd:initial-email-backlog",
      severity: "warning",
      title: "Emails premier contact non envoyés",
      message: `${input.pendingInitialEmail} rappels actifs sans email simulateur envoyé.`,
      href: "/commercial-callbacks",
      actionLabel: "Voir les rappels",
    });
  }

  if (input.globalSnapshotTotal > 80 && input.blockedConfirmCount > 25) {
    out.push({
      id: "cmd:pipeline-backlog",
      severity: "warning",
      title: "Backlog pipeline élevé",
      message: `${input.blockedConfirmCount} dossiers en attente confirmateur sur ${input.globalSnapshotTotal} dossiers actifs.`,
      href: "/confirmateur",
      actionLabel: "Poste confirmateur",
    });
  }

  return out;
}

function toCallbackShort(
  row: CommercialCallbackRow,
  now: Date,
): CallbackShortRow {
  const { businessScore } = computeCommercialCallbackScore(row, now);
  return {
    id: row.id,
    company: row.company_name?.trim() || "—",
    score: businessScore,
    href: "/commercial-callbacks",
    phone: row.phone?.trim() || null,
    canConvert: !isTerminalCallbackStatus(row.status),
  };
}

function wfTeamSheet(
  workflowsById: Map<string, any>,
  lead: { current_workflow_id: string | null; cee_sheet_id: string | null },
): { teamId: string | null; sheetId: string | null } {
  const wf = lead.current_workflow_id ? workflowsById.get(lead.current_workflow_id) : undefined;
  return {
    teamId: wf?.cee_sheet_team_id ?? null,
    sheetId: wf?.cee_sheet_id ?? lead.cee_sheet_id ?? null,
  };
}

export async function loadCommandCockpitData(access: AccessContext): Promise<CommandCockpitData | null> {
  if (access.kind !== "authenticated") {
    return null;
  }
  const fullCommandCockpit = canAccessCommandCockpit(access);
  if (!fullCommandCockpit && !(await isCeeTeamManager(access.userId))) {
    return null;
  }

  const cockpitVariant: CockpitVariant = fullCommandCockpit ? "sales_director" : "manager";

  const supabase = await createClient();
  const sinceIso = new Date(Date.now() - AUTOMATION_WINDOW_H * 3_600_000).toISOString();
  const now = new Date();
  const todayParis = calendarDateInParis(now);
  const weekStartMs = Date.now() - 7 * 86_400_000;
  const weekIso = new Date(weekStartMs).toISOString();
  const logSince90 = new Date(Date.now() - 90 * 86_400_000).toISOString();

  const inWeek = (iso: string) => new Date(iso).getTime() >= weekStartMs;

  const workflows: any[] = [];
  const workflowsById = new Map<string, any>();

  const [bundle, allCallbacks, automationRes, newLeadsRes, leadsWeekRes, workflowLogsRes] =
    await Promise.all([
    getCockpitBundle(access, DEFAULT_COCKPIT_FILTERS, {
      cockpitVariant,
      includeAdminHealth: fullCommandCockpit,
      preloadedWorkflows: workflows,
    }),
    fetchCommercialCallbacksAllVisible(),
    supabase
      .from("automation_logs")
      .select("id, automation_type, status, slack_event_type, error_message, created_at, result_json")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(600),
    supabase
      .from("leads")
      .select(
        "id, company_name, lead_status, created_at, created_by_agent_id, sim_saving_eur_30_selected, sim_install_total_price, simulated_at, phone, cee_sheet_id, current_workflow_id",
      )
      .is("deleted_at", null)
      .eq("lead_status", "new")
      .order("created_at", { ascending: false })
      .limit(72),
    supabase.from("leads").select("created_by_agent_id, created_at").is("deleted_at", null).gte("created_at", weekIso),
    supabase
      .from("workflow_event_logs")
      .select("*")
      .gte("created_at", logSince90)
      .order("created_at", { ascending: false })
      .limit(12_000),
  ]);

  const automationRows = automationRes.error ? [] : (automationRes.data ?? []);
  const newLeads = newLeadsRes.error ? [] : (newLeadsRes.data ?? []);
  const leadsWeekRows = leadsWeekRes.error ? [] : (leadsWeekRes.data ?? []);
  const ms24h = Date.now() - 86_400_000;
  const hotSimulatedLeads24h = newLeads.filter(
    (L) => L.simulated_at != null && new Date(L.simulated_at).getTime() >= ms24h,
  ).length;
  const wfLogs = (workflowLogsRes.error ? [] : (workflowLogsRes.data ?? [])) as WorkflowEventLogRow[];
  const logM = computeWorkflowLogMetrics(wfLogs, weekIso);
  const confirmateurQualifiedToday = new Set<string>();
  for (const r of wfLogs) {
    if (r.event_type !== "qualified") continue;
    if (calendarDateInParis(new Date(r.created_at)) !== todayParis) continue;
    if (r.actor_user_id) confirmateurQualifiedToday.add(r.actor_user_id);
  }

  const kpis = computeCommercialCallbackKpis(allCallbacks, now);
  const performanceCb = computeCallbackPerformanceStats(allCallbacks, now);

  const nonTerminal = allCallbacks.filter((r) => !isTerminalCallbackStatus(r.status));
  const pendingInitialEmail = nonTerminal.filter((r) => !r.initial_contact_email_sent).length;

  const members: any[] = [];
  const activeConfirmateurs = new Set(
    members.filter((m: any) => m.isActive && m.roleInTeam === "confirmateur").map((m: any) => m.userId as string),
  ).size;
  const activeClosers = new Set(
    members.filter((m: any) => m.isActive && m.roleInTeam === "closer").map((m: any) => m.userId as string),
  ).size;

  const teamMembersByTeam: Record<string, string[]> = {};
  for (const m of members as any[]) {
    if (!m.isActive) continue;
    const tid = m.ceeSheetTeamId as string;
    if (!teamMembersByTeam[tid]) teamMembersByTeam[tid] = [];
    teamMembersByTeam[tid].push(m.userId as string);
  }

  const agentRoleUserIds = new Set<string>(
    members.filter((m: any) => m.isActive && m.roleInTeam === "agent").map((m: any) => m.userId as string),
  );
  const confirmateurRoleUserIds = new Set<string>(
    members.filter((m: any) => m.isActive && m.roleInTeam === "confirmateur").map((m: any) => m.userId as string),
  );
  const closerRoleUserIds = new Set<string>(
    members.filter((m: any) => m.isActive && m.roleInTeam === "closer").map((m: any) => m.userId as string),
  );

  const globalSnapshot = buildWorkflowSnapshot(workflows);
  const blockedConfirmCount =
    globalSnapshot.funnel.simulation_done + globalSnapshot.funnel.to_confirm;

  const automationFailed48h = automationRows.filter((r) => r.status === "failed").length;

  const synth = buildSyntheticAlerts({
    callbackKpis: kpis,
    automationFailed48h,
    activeConfirmateurs,
    activeClosers,
    pendingInitialEmail,
    globalSnapshotTotal: globalSnapshot.funnel.total,
    blockedConfirmCount,
  });

  const bundleAlerts = [...bundle.periodAlerts, ...bundle.structuralAlerts].map(mapCockpitAlert);
  const alerts = sortAlerts(dedupeAlerts([...synth, ...bundleAlerts])).slice(0, MAX_ALERTS);

  const awaitConfirmWf = workflows.filter((w) =>
    ["simulation_done", "to_confirm"].includes(w.workflow_status),
  );
  const awaitCloserWf = workflows.filter((w) => ["to_close", "docs_prepared"].includes(w.workflow_status));
  const unassignedWf = workflows.filter(
    (w) => !w.assigned_agent_user_id && w.workflow_status !== "lost",
  );

  const blockedQueues = [
    ...globalSnapshot.priorityQueues.staleDrafts,
    ...globalSnapshot.priorityQueues.docsPreparedStale,
    ...globalSnapshot.priorityQueues.oldAgreementSent,
  ];
  const blockedWfRows = blockedQueues
    .map((q) => workflowsById.get(q.workflowId))
    .filter((w): w is any => w != null);

  const stuckBySheet = new Map<string, number>();
  for (const w of blockedWfRows) {
    const label = w.cee_sheet?.label?.trim() || w.cee_sheet?.code || "Fiche";
    stuckBySheet.set(label, (stuckBySheet.get(label) ?? 0) + 1);
  }
  const workflowStuckBySheet = [...stuckBySheet.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const awaitConfirmAvg = avgDaysSinceUpdated(awaitConfirmWf);
  const awaitCloserAvg = avgDaysSinceUpdated(awaitCloserWf);
  const unassignedAvg = avgDaysSinceUpdated(unassignedWf);
  const blockedAvg = avgDaysSinceUpdated(blockedWfRows);

  const stageAlerts: { id: string; message: string; href: string }[] = [];
  if (awaitConfirmAvg != null && awaitConfirmAvg >= 5) {
    stageAlerts.push({
      id: "stage:confirm-slow",
      message: `Attente confirmateur : ~${awaitConfirmAvg} j. en moyenne sur le stock.`,
      href: "/confirmateur",
    });
  }
  if (awaitCloserAvg != null && awaitCloserAvg >= 7) {
    stageAlerts.push({
      id: "stage:closer-slow",
      message: `Attente closer : ~${awaitCloserAvg} j. en moyenne.`,
      href: "/closer",
    });
  }
  if (unassignedAvg != null && unassignedAvg >= 4) {
    stageAlerts.push({
      id: "stage:unassigned-old",
      message: `Dossiers sans agent : ~${unassignedAvg} j. depuis la dernière mise à jour.`,
      href: "/leads",
    });
  }
  if (blockedAvg != null && blockedAvg >= 10) {
    stageAlerts.push({
      id: "stage:blocked-old",
      message: `Dossiers bloqués / stale : ~${blockedAvg} j. en moyenne.`,
      href: "/admin/cee-sheets",
    });
  }

  const unassignedAgent = unassignedWf.length;
  const blockedCount = blockedQueues.length;

  const autoAssignAgentHint = (() => {
    const first = unassignedWf[0];
    if (!first?.cee_sheet_team_id) return null;
    const pick = members.find(
      (m: any) => m.isActive && m.roleInTeam === "agent" && m.ceeSheetTeamId === first.cee_sheet_team_id,
    );
    if (!pick) return null;
    return { workflowId: first.id, agentUserId: pick.userId };
  })();

  const sampleBlocked = (() => {
    const merged = [
      ...globalSnapshot.priorityQueues.staleDrafts.slice(0, 4),
      ...globalSnapshot.priorityQueues.blockedConfirm.slice(0, 4),
    ];
    const seen = new Set<string>();
    const deduped: typeof merged = [];
    for (const q of merged) {
      if (seen.has(q.workflowId)) continue;
      seen.add(q.workflowId);
      deduped.push(q);
      if (deduped.length >= 6) break;
    }
    return deduped.map((q) => {
      const w = workflowsById.get(q.workflowId);
      return {
        workflowId: q.workflowId,
        leadId: q.leadId,
        companyName: q.companyName,
        status: q.status,
        sheetLabel: q.sheetLabel,
        teamId: w?.cee_sheet_team_id ?? null,
        sheetId: w?.cee_sheet_id ?? null,
      };
    });
  })();

  const pipeline = {
    awaitConfirmateur: blockedConfirmCount,
    awaitCloser: globalSnapshot.funnel.to_close + globalSnapshot.funnel.docs_prepared,
    unassignedAgent,
    staleDrafts: globalSnapshot.priorityQueues.staleDrafts.length,
    docsPreparedStale: globalSnapshot.priorityQueues.docsPreparedStale.length,
    oldAgreementSent: globalSnapshot.priorityQueues.oldAgreementSent.length,
    blockedCount,
    sampleBlocked,
    stageLatency: {
      awaitConfirmateurAvgDays: awaitConfirmAvg,
      awaitCloserAvgDays: awaitCloserAvg,
      unassignedAvgDays: unassignedAvg,
      blockedAvgDays: blockedAvg,
      alerts: stageAlerts,
    },
  };

  const cashCandidates: CashImmediateRow[] = [];

  for (const r of nonTerminal) {
    const overdue = isCallbackOverdue(r.status, r.callback_date, r.callback_time, now);
    const inCashStatus = CASH_CALLBACK_STATUSES.has(r.status) || overdue;
    if (!inCashStatus) continue;
    const cents = valueCentsCallback(r);
    const { businessScore } = computeCommercialCallbackScore(r, now);
    const highValue = cents >= 200_000 || businessScore >= 62;
    if (!highValue && !overdue) continue;
    cashCandidates.push({
      kind: "callback",
      id: r.id,
      company: r.company_name?.trim() || "—",
      score: businessScore,
      estimatedValueEur: r.estimated_value_eur,
      valueCents: cents,
      href: "/commercial-callbacks",
      phone: r.phone?.trim() || null,
      statusLabel: commercialCallbackStatusLabelFr(r.status),
      canConvert: true,
      teamId: null,
      sheetId: null,
      assignedAgentUserId: r.assigned_agent_user_id ?? null,
      createdByAgentId: null,
      overdueCallback: overdue,
    });
  }

  const hotLeads = newLeads.filter(
    (L) => L.simulated_at != null || (L.sim_saving_eur_30_selected ?? 0) > 0,
  );
  for (const L of hotLeads) {
    const { teamId, sheetId } = wfTeamSheet(workflowsById, L);
    const score = leadBusinessScore(L.sim_saving_eur_30_selected);
    const cents = valueCentsLead(L.sim_saving_eur_30_selected, L.sim_install_total_price);
    cashCandidates.push({
      kind: "lead",
      id: L.id,
      company: L.company_name?.trim() || "—",
      score,
      estimatedValueEur: L.sim_saving_eur_30_selected,
      valueCents: cents,
      href: `/leads/${L.id}`,
      phone: L.phone?.trim() || null,
      statusLabel: L.simulated_at ? "Simulateur rempli" : "Nouveau",
      canConvert: false,
      teamId,
      sheetId,
      assignedAgentUserId: null,
      createdByAgentId: L.created_by_agent_id ?? null,
      overdueCallback: false,
    });
  }

  const cashMap = new Map<string, CashImmediateRow>();
  for (const row of cashCandidates) {
    cashMap.set(`${row.kind}:${row.id}`, row);
  }
  const cashImmediate = [...cashMap.values()]
    .map((row) => ({
      row,
      p: computeCockpitPriority({
        valueCents: row.valueCents,
        overdue: row.overdueCallback,
        callbackScore: row.kind === "callback" ? row.score : undefined,
      }),
    }))
    .sort((a, b) => b.p - a.p || b.row.valueCents - a.row.valueCents || b.row.score - a.row.score)
    .map((x) => x.row)
    .slice(0, MAX_CASH);

  const scoredCallbacks: HotOpportunityRow[] = nonTerminal.map((r) => {
    const { businessScore } = computeCommercialCallbackScore(r, now);
    const overdueCb = isCallbackOverdue(r.status, r.callback_date, r.callback_time, now);
    const dueTodayCb = !overdueCb && isCallbackDueToday(r.status, r.callback_date, r.callback_time, now);
    return {
      kind: "callback",
      id: r.id,
      company: r.company_name?.trim() || "—",
      score: businessScore,
      estimatedValueEur: r.estimated_value_eur,
      valueCents: valueCentsCallback(r),
      href: "/commercial-callbacks",
      phone: r.phone?.trim() || null,
      statusLabel: commercialCallbackStatusLabelFr(r.status),
      canConvert: true,
      teamId: null,
      sheetId: null,
      assignedAgentUserId: r.assigned_agent_user_id ?? null,
      createdByAgentId: null,
      overdueCallback: overdueCb,
      dueTodayCallback: dueTodayCb,
      lastCallAt: r.last_call_at ?? null,
    };
  });

  const leadRows: HotOpportunityRow[] = newLeads.map((L) => {
    const { teamId, sheetId } = wfTeamSheet(workflowsById, L);
    return {
      kind: "lead",
      id: L.id,
      company: L.company_name?.trim() || "—",
      score: leadBusinessScore(L.sim_saving_eur_30_selected),
      estimatedValueEur: L.sim_saving_eur_30_selected,
      valueCents: valueCentsLead(L.sim_saving_eur_30_selected, L.sim_install_total_price),
      href: `/leads/${L.id}`,
      phone: L.phone?.trim() || null,
      statusLabel: L.simulated_at != null || (L.sim_saving_eur_30_selected ?? 0) > 0 ? "Simulateur rempli" : "Nouveau",
      canConvert: false,
      teamId,
      sheetId,
      assignedAgentUserId: null,
      createdByAgentId: L.created_by_agent_id ?? null,
      overdueCallback: false,
      createdAt: L.created_at,
    };
  });

  const opportunities = [...scoredCallbacks, ...leadRows]
    .map((row) => ({
      row,
      p: computeCockpitPriority({
        valueCents: row.valueCents,
        overdue: row.overdueCallback,
        callbackScore: row.kind === "callback" ? row.score : undefined,
      }),
    }))
    .sort((a, b) => b.p - a.p || b.row.score - a.row.score || b.row.valueCents - a.row.valueCents)
    .map((x) => x.row)
    .slice(0, MAX_OPPORTUNITIES);

  const overdueCallbacks = nonTerminal.filter((r) =>
    isCallbackOverdue(r.status, r.callback_date, r.callback_time, now),
  );
  const overdue = overdueCallbacks
    .map((r) => toCallbackShort(r, now))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const critical = nonTerminal
    .filter((r) => computeCommercialCallbackScore(r, now).band === "critical")
    .map((r) => toCallbackShort(r, now))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const highValue = nonTerminal
    .filter((r) => (r.estimated_value_eur ?? 0) >= 5000)
    .map((r) => toCallbackShort(r, now))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  let success = 0;
  let skipped = 0;
  let failed = 0;
  let slackAttempts = 0;
  let slackFailed = 0;
  let cfRuns = 0;
  let cfSent = 0;
  let cfSkipped = 0;
  let cfFailed = 0;

  for (const r of automationRows) {
    if (r.status === "success") success += 1;
    else if (r.status === "skipped") skipped += 1;
    else if (r.status === "failed") failed += 1;

    if (r.automation_type === "slack_smart_alert") {
      slackAttempts += 1;
      if (r.status === "failed") slackFailed += 1;
    }
    if (r.automation_type === "callback_auto_followup") {
      cfRuns += 1;
      if (r.status === "success") cfSent += 1;
      else if (r.status === "skipped") cfSkipped += 1;
      else if (r.status === "failed") cfFailed += 1;
    }
  }

  const emailFailed = cfFailed;

  const lastHourFails = automationRows.filter(
    (r) => r.status === "failed" && new Date(r.created_at).getTime() > Date.now() - 3_600_000,
  ).length;
  const cronHealthy = lastHourFails === 0;
  const health = automationHealth(lastHourFails, automationFailed48h, slackFailed, emailFailed);

  const recentErrors = automationRows
    .filter((r) => r.status === "failed")
    .slice(0, 12)
    .map((r) => ({
      at: r.created_at,
      automationType: r.automation_type,
      message: r.error_message ?? null,
    }));

  const automation = {
    windowHours: AUTOMATION_WINDOW_H,
    totalRuns: automationRows.length,
    success,
    skipped,
    failed,
    slackAttempts,
    slackFailed,
    emailFailed,
    health,
    callbackAutoFollowup: {
      runs: cfRuns,
      sent: cfSent,
      skipped: cfSkipped,
      failed: cfFailed,
    },
    cronHealthy,
    recentErrors,
  };

  const logLines: CommandCockpitLogLine[] = automationRows.slice(0, MAX_LOG_LINES).map((r) => {
    const sev: CommandCockpitLogLine["severity"] =
      r.status === "failed" ? "critical" : r.status === "skipped" ? "warning" : "info";
    const detail =
      r.error_message?.trim() ||
      (typeof r.result_json === "object" && r.result_json && "detail" in r.result_json
        ? String((r.result_json as { detail?: unknown }).detail ?? "")
        : "") ||
      r.status;
    return {
      at: r.created_at,
      label: r.automation_type,
      detail: detail.slice(0, 220),
      severity: sev,
    };
  });

  const leadsCreatedDayByAgent = new Map<string, number>();
  const leadsCreatedWeekByAgent = new Map<string, number>();
  const callbacksTreatedDayByAgent = new Map<string, number>();
  for (const cb of allCallbacks) {
    const aid = cb.assigned_agent_user_id;
    if (!aid) continue;
    if (calendarDateInParis(new Date(cb.updated_at)) !== todayParis) continue;
    if (!isTerminalCallbackStatus(cb.status)) continue;
    callbacksTreatedDayByAgent.set(aid, (callbacksTreatedDayByAgent.get(aid) ?? 0) + 1);
  }
  for (const row of leadsWeekRows) {
    const aid = row.created_by_agent_id;
    if (!aid) continue;
    leadsCreatedWeekByAgent.set(aid, (leadsCreatedWeekByAgent.get(aid) ?? 0) + 1);
    if (calendarDateInParis(new Date(row.created_at)) === todayParis) {
      leadsCreatedDayByAgent.set(aid, (leadsCreatedDayByAgent.get(aid) ?? 0) + 1);
    }
  }

  const callbacksTreatedWeekByAgent = new Map<string, number>();
  const callbacksConvertedWeekByAgent = new Map<string, number>();
  for (const cb of allCallbacks) {
    const aid = cb.assigned_agent_user_id;
    if (!aid || !inWeek(cb.updated_at)) continue;
    if (isTerminalCallbackStatus(cb.status)) {
      callbacksTreatedWeekByAgent.set(aid, (callbacksTreatedWeekByAgent.get(aid) ?? 0) + 1);
    }
    if (cb.status === "converted_to_lead") {
      callbacksConvertedWeekByAgent.set(aid, (callbacksConvertedWeekByAgent.get(aid) ?? 0) + 1);
    }
  }

  const confirmateurBacklog = new Map<string, any[]>();
  const confirmateurBacklogSumAge = new Map<string, number>();
  const confirmateurBacklogCount = new Map<string, number>();
  for (const w of awaitConfirmWf) {
    const u = w.assigned_confirmateur_user_id;
    if (!u) continue;
    if (!confirmateurBacklog.has(u)) confirmateurBacklog.set(u, []);
    confirmateurBacklog.get(u)!.push(w);
    const age = Date.now() - new Date(w.updated_at).getTime();
    confirmateurBacklogSumAge.set(u, (confirmateurBacklogSumAge.get(u) ?? 0) + age);
    confirmateurBacklogCount.set(u, (confirmateurBacklogCount.get(u) ?? 0) + 1);
  }

  const confirmateurTreatedWeek = new Map<string, number>();
  for (const w of workflows) {
    if (w.workflow_status !== "qualified") continue;
    const u = w.assigned_confirmateur_user_id;
    if (!u || !inWeek(w.updated_at)) continue;
    confirmateurTreatedWeek.set(u, (confirmateurTreatedWeek.get(u) ?? 0) + 1);
  }

  const closerOpenBy = new Map<string, number>();
  const closerOpenStatuses = new Set(["to_close", "docs_prepared", "agreement_sent"]);
  for (const w of workflows) {
    const c = w.assigned_closer_user_id;
    if (!c || !closerOpenStatuses.has(w.workflow_status)) continue;
    closerOpenBy.set(c, (closerOpenBy.get(c) ?? 0) + 1);
  }

  const signedStatuses = new Set(["agreement_signed", "paid", "quote_signed"]);
  const signedWeekWf = workflows.filter((w) => signedStatuses.has(w.workflow_status) && inWeek(w.updated_at));
  const signedWeekByCloser = new Map<string, number>();
  const signedLeadIds = [...new Set(signedWeekWf.map((w) => w.lead_id))];
  const leadPriceById = new Map<string, number>();
  if (signedLeadIds.length > 0) {
    const { data: priceRows } = await supabase
      .from("leads")
      .select("id, sim_install_total_price, sim_rest_to_charge")
      .in("id", signedLeadIds.slice(0, 400));
    for (const p of priceRows ?? []) {
      const v = p.sim_install_total_price ?? p.sim_rest_to_charge ?? 0;
      leadPriceById.set(p.id, typeof v === "number" ? v : 0);
    }
  }
  const closerCaWeek = new Map<string, number>();
  for (const w of signedWeekWf) {
    const c = w.assigned_closer_user_id;
    if (!c) continue;
    signedWeekByCloser.set(c, (signedWeekByCloser.get(c) ?? 0) + 1);
    const ca = leadPriceById.get(w.lead_id) ?? 0;
    closerCaWeek.set(c, (closerCaWeek.get(c) ?? 0) + ca);
  }

  const perfUserIds = new Set<string>();
  for (const id of agentRoleUserIds) perfUserIds.add(id);
  for (const id of confirmateurRoleUserIds) perfUserIds.add(id);
  for (const id of closerRoleUserIds) perfUserIds.add(id);
  for (const [id] of leadsCreatedWeekByAgent) perfUserIds.add(id);
  for (const [id] of callbacksTreatedWeekByAgent) perfUserIds.add(id);

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", [...perfUserIds]);

  const displayName = (userId: string): string => {
    const p = profileRows?.find((r) => r.id === userId);
    return p?.full_name?.trim() || p?.email?.trim() || userId.slice(0, 8);
  };
  const profileEmail = (userId: string): string | null => profileRows?.find((r) => r.id === userId)?.email?.trim() ?? null;

  const agents: CockpitAgentPerformanceRow[] = [];
  for (const userId of agentRoleUserIds) {
    const lw = leadsCreatedWeekByAgent.get(userId) ?? 0;
    const ld = leadsCreatedDayByAgent.get(userId) ?? 0;
    const tw = callbacksTreatedWeekByAgent.get(userId) ?? 0;
    const cw = callbacksConvertedWeekByAgent.get(userId) ?? 0;
    const conversionRatePct = tw > 0 ? Math.round((cw / tw) * 1000) / 10 : null;
    agents.push({
      userId,
      displayName: displayName(userId),
      leadsCreatedDay: ld,
      leadsCreatedWeek: lw,
      callbacksTreatedWeek: tw,
      callbacksConvertedWeek: cw,
      conversionRatePct,
      workflowTransitionsWeek: logM.transitionsByUserWeek[userId] ?? 0,
      highlight: null,
    });
  }
  const agentScore = (a: CockpitAgentPerformanceRow) => a.leadsCreatedWeek * 2 + a.callbacksConvertedWeek * 5 + a.callbacksTreatedWeek;
  const sortedAgents = [...agents].sort((a, b) => agentScore(b) - agentScore(a));
  const topAgentIds = new Set(sortedAgents.slice(0, 2).filter((a) => agentScore(a) > 0).map((a) => a.userId));
  for (const a of agents) {
    if (topAgentIds.has(a.userId)) a.highlight = "top";
    else if (a.leadsCreatedWeek === 0 && a.callbacksTreatedWeek === 0 && a.callbacksConvertedWeek === 0) {
      a.highlight = "anomaly";
    }
  }

  const confirmateurs: CockpitConfirmateurPerformanceRow[] = [];
  for (const userId of confirmateurRoleUserIds) {
    const backlog = confirmateurBacklog.get(userId)?.length ?? 0;
    const n = confirmateurBacklogCount.get(userId) ?? 0;
    const sum = confirmateurBacklogSumAge.get(userId) ?? 0;
    const avgBacklogAgeDays =
      n > 0 ? Math.round((sum / n / 86_400_000) * 10) / 10 : null;
    confirmateurs.push({
      userId,
      displayName: displayName(userId),
      backlog,
      treatedApproxWeek: confirmateurTreatedWeek.get(userId) ?? 0,
      avgBacklogAgeDays,
      medianHoursConfirmStageFromLogs: logM.confirmateurMedianHours,
      highlight: null,
    });
  }
  const sortedConf = [...confirmateurs].sort(
    (a, b) => b.treatedApproxWeek - a.treatedApproxWeek || a.backlog - b.backlog,
  );
  const topConfIds = new Set(sortedConf.slice(0, 2).filter((c) => c.treatedApproxWeek > 0).map((c) => c.userId));
  for (const c of confirmateurs) {
    if (topConfIds.has(c.userId)) c.highlight = "top";
    else if (c.backlog >= 12 || (c.avgBacklogAgeDays != null && c.avgBacklogAgeDays >= 8)) {
      c.highlight = "anomaly";
    }
  }

  const closers: CockpitCloserPerformanceRow[] = [];
  for (const userId of closerRoleUserIds) {
    const open = closerOpenBy.get(userId) ?? 0;
    const signed = signedWeekByCloser.get(userId) ?? 0;
    const ca = closerCaWeek.get(userId) ?? 0;
    const denom = open + signed;
    const signatureRatePct = denom > 0 ? Math.round((signed / denom) * 1000) / 10 : null;
    closers.push({
      userId,
      displayName: displayName(userId),
      pipelineOpen: open,
      signedWeek: signed,
      signatureRatePct,
      caGeneratedWeekEur: Math.round(ca * 100) / 100,
      medianHoursCloserStageFromLogs: logM.closerMedianHours,
      highlight: null,
    });
  }
  const sortedClosers = [...closers].sort((a, b) => b.signedWeek - a.signedWeek || b.caGeneratedWeekEur - a.caGeneratedWeekEur);
  const topCloserIds = new Set(sortedClosers.slice(0, 2).filter((c) => c.signedWeek > 0).map((c) => c.userId));
  for (const c of closers) {
    if (topCloserIds.has(c.userId)) c.highlight = "top";
    else if (c.pipelineOpen >= 6 && c.signedWeek === 0) c.highlight = "anomaly";
  }

  const humanAnomalies = buildHumanAnomalies({
    agents: [...agentRoleUserIds].map((userId) => ({
      userId,
      displayName: displayName(userId),
      email: profileEmail(userId),
      leadsDay: leadsCreatedDayByAgent.get(userId) ?? 0,
      callbacksTreatedDay: callbacksTreatedDayByAgent.get(userId) ?? 0,
      treatedWeek: callbacksTreatedWeekByAgent.get(userId) ?? 0,
      leadsWeek: leadsCreatedWeekByAgent.get(userId) ?? 0,
    })),
    confirmateurs: confirmateurs.map((c) => ({
      userId: c.userId,
      displayName: c.displayName,
      email: profileEmail(c.userId),
      backlog: c.backlog,
      avgBacklogAgeDays: c.avgBacklogAgeDays,
    })),
    closers: closers.map((c) => ({
      userId: c.userId,
      displayName: c.displayName,
      email: profileEmail(c.userId),
      pipelineOpen: c.pipelineOpen,
      signedWeek: c.signedWeek,
      signatureRatePct: c.signatureRatePct,
    })),
    todayParis,
    confirmateurQualifiedToday,
  });

  const workflowJournalPreview = wfLogs.slice(0, 25).map((r) => ({
    at: r.created_at,
    eventType: r.event_type,
    leadId: r.lead_id,
    fromStatus: r.from_status,
    toStatus: r.to_status,
  }));

  const workflowLogMetrics = {
    confirmateurMedianHours: logM.confirmateurMedianHours,
    closerMedianHours: logM.closerMedianHours,
    conversionRateFromLogsPct: logM.conversionRatePct,
    conversionNumerator: logM.conversionNumerator,
    conversionDenominator: logM.conversionDenominator,
  };

  const sheetsWithoutTeam = bundle.sheetsWithoutTeam.map((s) => ({ sheetId: s.sheetId, label: s.label }));

  let internalSla: CommandCockpitData["internalSla"] = null;
  if (fullCommandCockpit) {
    try {
      const slaAdmin = createAdminClient();
      internalSla = await loadCockpitInternalSlaBlock(slaAdmin, now);
    } catch {
      internalSla = null;
    }
  }

  const base: CockpitDataForAi = {
    humanAnomalies,
    workflowLogMetrics,
    workflowJournalPreview,
    cashImmediate,
    sheetsWithoutTeam,
    hotSimulatedLeads24h,
    workflowStuckBySheet,
    filterOptions: {
      teams: bundle.filterOptions.teams,
      sheets: bundle.filterOptions.sheets,
    },
    teamMembersByTeam,
    alerts,
    opportunities,
    callbacks: {
      kpis: kpis,
      performance: performanceCb,
      overdue,
      critical,
      highValue,
    },
    pipeline,
    automation,
    logs: { lines: logLines },
    performance: {
      agents,
      confirmateurs,
      closers,
    },
    aiExecutionHints: { autoAssignAgent: autoAssignAgentHint },
    internalSla,
  };

  let aiRecommendations: CockpitAiRecommendation[] = [];
  let heuristicOnly = true;
  let aiOrchestratorActivity: CockpitAiOrchestratorActivity | null = null;
  if (fullCommandCockpit) {
    const gen = await generateCockpitAiRecommendations(base);
    aiRecommendations = gen.recommendations;
    heuristicOnly = gen.heuristicOnly;
    if (aiRecommendations.length > 0) {
      aiRecommendations = await mergeCockpitAiExecutionStatuses(supabase, access.userId, aiRecommendations);
    }
    try {
      const admin = createAdminClient();
      const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
      const { data: orchLogs } = await admin
        .from("ai_action_logs")
        .select("id, recommendation_id, action_type, status, error_message, reason, created_at")
        .eq("executed_by", "ai")
        .eq("trigger_source", "ai_orchestrator")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(80);
      const rows = orchLogs ?? [];
      aiOrchestratorActivity = {
        executed24h: rows.filter((r) => r.status === "success").length,
        failed24h: rows.filter((r) => r.status === "failed").length,
        pending24h: rows.filter((r) => r.status === "pending").length,
        recent: rows.slice(0, 14).map((r) => ({
          id: r.id,
          recommendationId: r.recommendation_id,
          actionType: r.action_type,
          status: r.status,
          createdAt: r.created_at,
          reason: r.reason,
          errorMessage: r.error_message,
        })),
      };
    } catch {
      aiOrchestratorActivity = null;
    }
  }

  return {
    ...base,
    aiRecommendations,
    aiRecommendationsMeta: { heuristicOnly },
    aiOrchestratorActivity,
  };
}
