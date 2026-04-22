import type { ManagedTeamMemberRow } from "@/features/dashboard/queries/get-managed-teams-context";

const MS_DAY = 86_400_000;

const POST_SIMULATION: Set<string> = new Set([
  "simulation_done",
  "to_confirm",
  "qualified",
  "docs_prepared",
  "to_close",
  "agreement_sent",
  "agreement_signed",
  "quote_pending",
  "quote_sent",
  "quote_signed",
  "technical_visit_pending",
  "technical_visit_done",
  "installation_pending",
  "cee_deposit_pending",
  "cee_deposited",
  "paid",
]);

const SENT_TO_CONFIRMEUR: Set<string> = new Set([
  "to_confirm",
  "qualified",
  "docs_prepared",
  "to_close",
  "agreement_sent",
  "agreement_signed",
  "quote_pending",
  "quote_sent",
  "quote_signed",
  "technical_visit_pending",
  "technical_visit_done",
  "installation_pending",
  "cee_deposit_pending",
  "cee_deposited",
  "paid",
]);

const CONF_BACKLOG: Set<string> = new Set(["simulation_done", "to_confirm"]);

const DOCS_PATH: Set<string> = new Set([
  "docs_prepared",
  "to_close",
  "agreement_sent",
  "agreement_signed",
  "quote_pending",
  "quote_sent",
  "quote_signed",
  "paid",
  "lost",
]);

const SIGNED: Set<string> = new Set(["agreement_signed", "paid", "quote_signed"]);

function qualString(q: unknown, key: string): string | null {
  if (!q || typeof q !== "object" || Array.isArray(q)) return null;
  const v = (q as Record<string, unknown>)[key];
  return typeof v === "string" && v.trim() ? v : null;
}

function primaryChannel(rows: any[]): string {
  const counts = new Map<string, number>();
  for (const w of rows) {
    const ch = w.lead?.lead_channel?.trim();
    if (!ch) continue;
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  if (counts.size === 0) return "—";
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function countLeadsCreatedInRange(
  rows: any[],
  startIso: string,
  endIso: string,
): number {
  const seen = new Set<string>();
  for (const w of rows) {
    const id = w.lead?.id;
    const ca = w.lead?.created_at;
    if (!id || !ca) continue;
    if (ca >= startIso && ca < endIso) seen.add(id);
  }
  return seen.size;
}

function countCallbacksOverdue(rows: any[], nowMs: number): number {
  let n = 0;
  for (const w of rows) {
    const cb = w.lead?.callback_at;
    if (!cb) continue;
    const t = new Date(cb).getTime();
    if (Number.isFinite(t) && t < nowMs) n += 1;
  }
  return n;
}

function countFollowUpsOverdue(rows: any[], nowMs: number): number {
  let n = 0;
  for (const w of rows) {
    if (w.workflow_status !== "agreement_sent") continue;
    const raw = qualString(w.qualification_data_json, "next_follow_up_at");
    if (!raw) continue;
    const t = new Date(raw).getTime();
    if (Number.isFinite(t) && t < nowMs) n += 1;
  }
  return n;
}

function avgMsToSignature(rows: any[]): number | null {
  const vals: number[] = [];
  for (const w of rows) {
    if (!SIGNED.has(w.workflow_status)) continue;
    const sent = w.agreement_sent_at ? new Date(w.agreement_sent_at).getTime() : null;
    const signed = w.agreement_signed_at ? new Date(w.agreement_signed_at).getTime() : null;
    if (sent && signed && signed >= sent) vals.push(signed - sent);
  }
  if (vals.length === 0) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round(avg / MS_DAY * 10) / 10;
}

function staleConfirmCount(rows: any[], nowMs: number, days: number): number {
  const lim = days * MS_DAY;
  return rows.filter((w) => {
    if (!CONF_BACKLOG.has(w.workflow_status)) return false;
    return nowMs - new Date(w.updated_at).getTime() > lim;
  }).length;
}

export type ManagerMemberPerformanceRow = {
  userId: string;
  fullName: string;
  email: string;
  roleInTeam: string;
  teamId: string;
  teamName: string;
  callCenterLabel: string;
  sheetLabels: string;
  isActive: boolean;
  chargePeriod: number;
  trendWorkloadPct: number | null;
  kpi: Record<string, number | string | null>;
  alerts: string[];
};

function trendPct(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function filterRowsForMemberRole(
  rows: any[],
  userId: string,
  role: string,
  teamId: string,
): any[] {
  if (role === "agent") return rows.filter((w) => w.assigned_agent_user_id === userId);
  if (role === "closer") return rows.filter((w) => w.assigned_closer_user_id === userId);
  if (role === "manager") return rows.filter((w) => w.cee_sheet_team_id === teamId);
  return [];
}

function buildKpisForRole(
  role: string,
  rowsC: any[],
  rowsP: any[],
  periodStart: string,
  periodEnd: string,
  nowMs: number,
): Record<string, number | string | null> {
  if (role === "agent") {
    const simOk = rowsC.filter((w) => POST_SIMULATION.has(w.workflow_status)).length;
    const sentConf = rowsC.filter((w) =>
      SENT_TO_CONFIRMEUR.has(w.workflow_status),
    ).length;
    const leadsCreated = countLeadsCreatedInRange(rowsC, periodStart, periodEnd);
    const callbacks = countCallbacksOverdue(rowsC, nowMs);
    const denom = Math.max(1, simOk);
    const transmissionPct = Math.round((sentConf / denom) * 1000) / 10;
    const simOkP = rowsP.filter((w) => POST_SIMULATION.has(w.workflow_status)).length;
    const sentConfP = rowsP.filter((w) =>
      SENT_TO_CONFIRMEUR.has(w.workflow_status),
    ).length;
    const denomP = Math.max(1, simOkP);
    const transmissionPrev = Math.round((sentConfP / denomP) * 1000) / 10;
    return {
      leadsCrees: leadsCreated,
      workflowsPeriode: rowsC.length,
      simulationsValidees: simOk,
      envoisConfirmateur: sentConf,
      rappelsEnRetard: callbacks,
      tauxTransmissionPct: transmissionPct,
      tauxTransmissionPrevPct: simOkP > 0 ? transmissionPrev : null,
    };
  }
  if (role === "closer") {
    const sent = rowsC.filter((w) => w.workflow_status === "agreement_sent").length;
    const signed = rowsC.filter((w) => SIGNED.has(w.workflow_status)).length;
    const lost = rowsC.filter((w) => w.workflow_status === "lost").length;
    const relances = countFollowUpsOverdue(rowsC, nowMs);
    const denom = sent + signed;
    const signRate = denom > 0 ? Math.round((signed / denom) * 1000) / 10 : null;
    const sentP = rowsP.filter((w) => w.workflow_status === "agreement_sent").length;
    const signedP = rowsP.filter((w) => SIGNED.has(w.workflow_status)).length;
    const denomP = sentP + signedP;
    const signRateP = denomP > 0 ? Math.round((signedP / denomP) * 1000) / 10 : null;
    const avgDays = avgMsToSignature(rowsC);
    return {
      accordsEnvoyes: sent,
      relancesDues: relances,
      accordsSignes: signed,
      pertes: lost,
      tauxSignaturePct: signRate,
      tauxSignaturePrevPct: signRateP,
      delaiMoyenJoursAvantSignature: avgDays,
    };
  }
  return {
    dossiersEquipeTouches: rowsC.length,
  };
}

function computeAlertsForRow(
  role: string,
  kpi: Record<string, number | string | null>,
  trendWorkloadPct: number | null,
  teamMedianCharge: number,
  charge: number,
): string[] {
  const out: string[] = [];
  if (teamMedianCharge > 0 && charge > Math.max(teamMedianCharge * 1.5, teamMedianCharge + 8)) {
    out.push("Surcharge relative");
  }
  if (trendWorkloadPct != null && trendWorkloadPct <= -25) {
    out.push("Activité en baisse vs période précédente");
  }
  if (role === "closer") {
    const r = kpi.relancesDues as number | undefined;
    if (r != null && r >= 4) out.push("Relances en retard");
    const sr = kpi.tauxSignaturePct as number | null | undefined;
    if (sr != null && sr < 12) out.push("Taux de signature sous pression");
  }
  if (role === "agent") {
    const cb = kpi.rappelsEnRetard as number | undefined;
    if (cb != null && cb >= 3) out.push("Rappels prospects en retard");
  }
  return out;
}

export function buildManagerMemberPerformanceRows(input: {
  members: ManagedTeamMemberRow[];
  rowsCurrent: any[];
  rowsPrevious: any[];
  periodStartIso: string;
  periodEndIso: string;
  now: Date;
  roleTab: "all" | "agent" | "closer";
  membersActiveOnly: boolean;
  memberUserId: string | null;
}): ManagerMemberPerformanceRow[] {
  const nowMs = input.now.getTime();
  let list = input.members;
  if (input.membersActiveOnly) list = list.filter((m) => m.isActive);
  if (input.memberUserId) list = list.filter((m) => m.userId === input.memberUserId);
  if (input.roleTab !== "all") {
    list = list.filter((m) => m.roleInTeam === input.roleTab);
  }

  const charges = list.map((m) => {
    const rc = filterRowsForMemberRole(input.rowsCurrent, m.userId, m.roleInTeam, m.teamId);
    return rc.length;
  });
  const sorted = [...charges].sort((a, b) => a - b);
  const medianCharge = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;

  return list.map((m) => {
    const rc = filterRowsForMemberRole(input.rowsCurrent, m.userId, m.roleInTeam, m.teamId);
    const rp = filterRowsForMemberRole(input.rowsPrevious, m.userId, m.roleInTeam, m.teamId);
    const kpi = buildKpisForRole(
      m.roleInTeam,
      rc,
      rp,
      input.periodStartIso,
      input.periodEndIso,
      nowMs,
    );
    const trendWorkloadPct = trendPct(rc.length, rp.length);
    const alerts = computeAlertsForRow(m.roleInTeam, kpi, trendWorkloadPct, medianCharge, rc.length);
    return {
      userId: m.userId,
      fullName: m.fullName?.trim() || m.email || m.userId,
      email: m.email,
      roleInTeam: m.roleInTeam,
      teamId: m.teamId,
      teamName: m.teamName,
      callCenterLabel: primaryChannel(rc),
      sheetLabels: m.sheetLabel,
      isActive: m.isActive,
      chargePeriod: rc.length,
      trendWorkloadPct,
      kpi,
      alerts,
    };
  });
}
