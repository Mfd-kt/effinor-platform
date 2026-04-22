import type {
  CockpitChannelRollup,
  CockpitFunnelCounts,
  CockpitQueueItem,
  CockpitScopeFilters,
  CockpitSheetRollup,
  CockpitTeamRollup,
  CockpitTrend,
  CockpitWorkflowSnapshot,
} from "@/features/dashboard/domain/cockpit";
import { getCockpitPeriodRange } from "@/features/dashboard/lib/cockpit-period";
import type { CockpitIsoRange } from "@/features/dashboard/lib/cockpit-period";
import { COCKPIT_ALERT_THRESHOLDS as COCKPIT_THRESHOLDS } from "@/features/dashboard/lib/cockpit-alert-thresholds";

export { getCockpitPeriodStartIso } from "@/features/dashboard/lib/cockpit-period";
export type { CockpitIsoRange } from "@/features/dashboard/lib/cockpit-period";

// TODO: cee-workflows retiré — la liste de statuts venait de CEE_WORKFLOW_STATUS_VALUES.
// On pré-remplit ici les statuts encore consommés par l'UI/alertes pour éviter `undefined`.
const FUNNEL_STATUS_KEYS = [
  "draft",
  "to_qualify",
  "to_confirm",
  "qualified",
  "documents_in_preparation",
  "documents_prepared",
  "agreement_sent",
  "agreement_received",
  "agreement_signed",
  "quote_signed",
  "paid",
  "lost",
  "simulation_done",
] as const;

function emptyFunnel(): CockpitFunnelCounts {
  const base = { total: 0 } as CockpitFunnelCounts;
  for (const k of FUNNEL_STATUS_KEYS) {
    base[k] = 0;
  }
  return base;
}

export function computeTrend(current: number, previous: number): CockpitTrend {
  if (previous === 0) {
    return { current, previous, deltaPct: current > 0 ? 100 : null };
  }
  return {
    current,
    previous,
    deltaPct: Math.round(((current - previous) / previous) * 1000) / 10,
  };
}

/** Filtre mémoire (après fetch RLS). */
export function filterWorkflowsForCockpit(
  rows: any[],
  filters: CockpitScopeFilters,
  opts?: { applyPeriod?: boolean },
): any[] {
  let next = rows.filter((w) => {
    if (filters.ceeSheetId && w.cee_sheet_id !== filters.ceeSheetId) return false;
    if (filters.teamId && w.cee_sheet_team_id !== filters.teamId) return false;
    const ch = w.lead?.lead_channel?.trim();
    if (filters.leadChannel) {
      if (!ch || ch !== filters.leadChannel) return false;
    }
    return true;
  });
  if (opts?.applyPeriod !== false) {
    next = filterWorkflowsByCreatedPeriod(next, filters.period);
  }
  return next;
}

/** Filtre sur `created_at` du workflow : [start, end) cockpit (fin = maintenant). */
export function filterWorkflowsByCreatedRange(
  rows: any[],
  range: CockpitIsoRange,
): any[] {
  return rows.filter((w) => w.created_at >= range.startIso && w.created_at < range.endIso);
}

/** Filtre sur `created_at` du workflow (pipeline « créé dans la période »). */
export function filterWorkflowsByCreatedPeriod(
  rows: any[],
  period: CockpitScopeFilters["period"],
  now = new Date(),
): any[] {
  return filterWorkflowsByCreatedRange(rows, getCockpitPeriodRange(period, now));
}

function rowToQueueItem(w: any): CockpitQueueItem {
  return {
    workflowId: w.id,
    leadId: w.lead_id,
    companyName: w.lead?.company_name?.trim() || "—",
    status: w.workflow_status,
    sheetLabel: w.cee_sheet?.label ?? w.cee_sheet?.code ?? "—",
    teamId: w.cee_sheet_team_id ?? null,
    updatedAt: w.updated_at,
    agreementSentAt: w.agreement_sent_at ?? null,
  };
}

const MS_DAY = 86_400_000;

export function buildWorkflowSnapshot(
  rows: any[],
  opts?: {
    staleDraftDays?: number;
    staleAgreementDays?: number;
    docsPreparedStaleDays?: number;
  },
): CockpitWorkflowSnapshot {
  const staleDraftDays = opts?.staleDraftDays ?? COCKPIT_THRESHOLDS.draft.staleDraftDays;
  const staleAgreementDays =
    opts?.staleAgreementDays ?? COCKPIT_THRESHOLDS.closer.agreementSentStaleDaysCritical;
  const docsPreparedStaleDays =
    opts?.docsPreparedStaleDays ?? COCKPIT_THRESHOLDS.docs.docsPreparedStaleDaysWarning;
  const now = Date.now();

  const funnel = emptyFunnel();
  const sheetMap = new Map<string, CockpitSheetRollup>();
  const teamMap = new Map<string, CockpitTeamRollup>();
  const channelMap = new Map<string, CockpitChannelRollup>();

  const staleDrafts: CockpitQueueItem[] = [];
  const docsPreparedStale: CockpitQueueItem[] = [];
  const agreementsAwaitingSign: CockpitQueueItem[] = [];
  const oldAgreementSent: CockpitQueueItem[] = [];

  for (const w of rows) {
    const st = w.workflow_status;
    funnel.total += 1;
    funnel[st] = (funnel[st] ?? 0) + 1;

    const sid = w.cee_sheet_id;
    const sheetLabel = w.cee_sheet?.label ?? "—";
    const sheetCode = w.cee_sheet?.code ?? "";
    if (!sheetMap.has(sid)) {
      sheetMap.set(sid, {
        sheetId: sid,
        sheetCode,
        sheetLabel,
        workflowCount: 0,
        byStatus: {},
        signed: 0,
        lost: 0,
        sent: 0,
      });
    }
    const sr = sheetMap.get(sid)!;
    sr.workflowCount += 1;
    sr.byStatus[st] = (sr.byStatus[st] ?? 0) + 1;
    if (st === "agreement_signed" || st === "paid" || st === "quote_signed") sr.signed += 1;
    if (st === "lost") sr.lost += 1;
    if (st === "agreement_sent") sr.sent += 1;

    const tid = w.cee_sheet_team_id;
    if (tid) {
      if (!teamMap.has(tid)) {
        teamMap.set(tid, {
          teamId: tid,
          teamName: tid,
          sheetId: sid,
          workflowCount: 0,
          byStatus: {},
        });
      }
      const tr = teamMap.get(tid)!;
      tr.workflowCount += 1;
      tr.byStatus[st] = (tr.byStatus[st] ?? 0) + 1;
    }

    const ch = w.lead?.lead_channel?.trim() || "—";
    if (!channelMap.has(ch)) {
      channelMap.set(ch, { channel: ch, workflowCount: 0, qualifiedPlus: 0, signed: 0 });
    }
    const cr = channelMap.get(ch)!;
    cr.workflowCount += 1;
    if (
      [
        "qualified",
        "docs_prepared",
        "to_close",
        "agreement_sent",
        "agreement_signed",
        "paid",
      ].includes(st)
    ) {
      cr.qualifiedPlus += 1;
    }
    if (st === "agreement_signed" || st === "paid" || st === "quote_signed") cr.signed += 1;

    const updated = new Date(w.updated_at).getTime();
    if (st === "draft" && now - updated > staleDraftDays * MS_DAY) {
      staleDrafts.push(rowToQueueItem(w));
    }
    if (st === "docs_prepared" && now - updated > docsPreparedStaleDays * MS_DAY) {
      docsPreparedStale.push(rowToQueueItem(w));
    }
    if (st === "agreement_sent") {
      agreementsAwaitingSign.push(rowToQueueItem(w));
      const sentAt = w.agreement_sent_at ? new Date(w.agreement_sent_at).getTime() : updated;
      if (now - sentAt > staleAgreementDays * MS_DAY) {
        oldAgreementSent.push(rowToQueueItem(w));
      }
    }
  }

  const sortByUpdated = (a: CockpitQueueItem, b: CockpitQueueItem) =>
    a.updatedAt.localeCompare(b.updatedAt);

  staleDrafts.sort(sortByUpdated);
  docsPreparedStale.sort(sortByUpdated);
  agreementsAwaitingSign.sort(sortByUpdated);
  oldAgreementSent.sort((a, b) => (b.agreementSentAt ?? "").localeCompare(a.agreementSentAt ?? ""));

  return {
    funnel,
    bySheet: [...sheetMap.values()].sort((a, b) => b.workflowCount - a.workflowCount),
    byTeam: [...teamMap.values()].sort((a, b) => b.workflowCount - a.workflowCount),
    byChannel: [...channelMap.values()].sort((a, b) => b.workflowCount - a.workflowCount),
    priorityQueues: {
      staleDrafts: staleDrafts.slice(0, 12),
      docsPreparedStale: docsPreparedStale.slice(0, 12),
      agreementsAwaitingSign: agreementsAwaitingSign.slice(0, 12),
      oldAgreementSent: oldAgreementSent.slice(0, 12),
    },
  };
}

export function conversionRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}
