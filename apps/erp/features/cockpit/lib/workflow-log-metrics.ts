import type { Database } from "@/types/database.types";

export type WorkflowEventLogRow = Database["public"]["Tables"]["workflow_event_logs"]["Row"];

function medianHours(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  const v = s.length % 2 === 1 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
  return Math.round(v * 10) / 10;
}

function hoursBetween(aIso: string, bIso: string): number {
  return (new Date(bIso).getTime() - new Date(aIso).getTime()) / 3_600_000;
}

/** Regroupe les logs par workflow, tri chronologique ascendant. */
function byWorkflowChrono(logs: WorkflowEventLogRow[]): Map<string, WorkflowEventLogRow[]> {
  const m = new Map<string, WorkflowEventLogRow[]>();
  for (const r of logs) {
    if (!m.has(r.workflow_id)) m.set(r.workflow_id, []);
    m.get(r.workflow_id)!.push(r);
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  return m;
}

export type WorkflowLogMetricsComputed = {
  confirmateurMedianHours: number | null;
  closerMedianHours: number | null;
  transitionsByUserWeek: Record<string, number>;
  /** Workflows créés (log) sur la fenêtre ayant au moins un « converted » après. */
  conversionNumerator: number;
  /** Workflows distincts avec au moins un « created » sur la fenêtre. */
  conversionDenominator: number;
  conversionRatePct: number | null;
};

export function computeWorkflowLogMetrics(
  logs: WorkflowEventLogRow[],
  windowStartIso: string,
): WorkflowLogMetricsComputed {
  const inWindow = (iso: string) => iso >= windowStartIso;

  const transitionsByUserWeek: Record<string, number> = {};
  for (const r of logs) {
    if (!inWindow(r.created_at) || !r.actor_user_id) continue;
    transitionsByUserWeek[r.actor_user_id] = (transitionsByUserWeek[r.actor_user_id] ?? 0) + 1;
  }

  const byWf = byWorkflowChrono(logs);
  const confirmDeltas: number[] = [];
  const closerDeltas: number[] = [];

  for (const events of byWf.values()) {
    let sentConfirmAt: string | null = null;
    let sentCloserAt: string | null = null;
    for (const e of events) {
      if (e.event_type === "sent_to_confirmateur") {
        sentConfirmAt = e.created_at;
      }
      if (e.event_type === "qualified" && sentConfirmAt) {
        confirmDeltas.push(hoursBetween(sentConfirmAt, e.created_at));
        sentConfirmAt = null;
      }
      if (e.event_type === "sent_to_closer") {
        sentCloserAt = e.created_at;
      }
      if (e.event_type === "converted" && sentCloserAt) {
        closerDeltas.push(hoursBetween(sentCloserAt, e.created_at));
        sentCloserAt = null;
      }
    }
  }

  const createdWfIds = new Set<string>();
  const convertedWfIds = new Set<string>();
  for (const r of logs) {
    if (r.event_type === "created" && inWindow(r.created_at)) {
      createdWfIds.add(r.workflow_id);
    }
    if (r.event_type === "converted") {
      convertedWfIds.add(r.workflow_id);
    }
  }
  let num = 0;
  for (const id of createdWfIds) {
    if (convertedWfIds.has(id)) num += 1;
  }
  const denom = createdWfIds.size;
  const conversionRatePct =
    denom > 0 ? Math.round((num / denom) * 1000) / 10 : null;

  return {
    confirmateurMedianHours: medianHours(confirmDeltas),
    closerMedianHours: medianHours(closerDeltas),
    transitionsByUserWeek,
    conversionNumerator: num,
    conversionDenominator: denom,
    conversionRatePct,
  };
}
