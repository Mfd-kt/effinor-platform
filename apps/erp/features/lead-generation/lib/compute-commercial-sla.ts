import type { CommercialPipelineStatus } from "../domain/commercial-pipeline-status";
import type { CommercialSlaStatus } from "../domain/commercial-pipeline-sla";

/** Nouveau : traiter sous 2 h. */
const NEW_MS = 2 * 60 * 60 * 1000;
/** Contacté : relancer ou convertir sous 24 h (depuis dernière activité). */
const CONTACTED_MS = 24 * 60 * 60 * 1000;

export type CommercialSlaFields = {
  slaDueAt: string | null;
  slaWindowStartAt: string | null;
  slaStatus: CommercialSlaStatus | null;
};

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeStatusFromDueAndStart(startMs: number, dueMs: number, nowMs: number): CommercialSlaFields {
  const slaDueAt = new Date(dueMs).toISOString();
  const slaWindowStartAt = new Date(startMs).toISOString();
  const total = dueMs - startMs;
  if (total <= 0) {
    return {
      slaDueAt,
      slaWindowStartAt,
      slaStatus: nowMs > dueMs ? "breached" : "on_time",
    };
  }
  if (nowMs > dueMs) {
    return { slaDueAt, slaWindowStartAt, slaStatus: "breached" };
  }
  const remaining = dueMs - nowMs;
  if (remaining < 0.2 * total) {
    return { slaDueAt, slaWindowStartAt, slaStatus: "warning" };
  }
  return { slaDueAt, slaWindowStartAt, slaStatus: "on_time" };
}

export type CommercialSlaComputeInput = {
  now: Date;
  commercialPipelineStatus: CommercialPipelineStatus;
  outcome: string;
  assignedAt: string | null;
  lastActivityAt: string | null;
  /** Prochaine relance (min des next_action_at), y compris en retard. */
  nearestNextActionAt: string | null;
};

/**
 * Calcule les champs SLA à partir de la pipeline et des dates.
 * Sortie alignée sur : Nouveau 2h, Contacté 24h depuis dernière activité, À rappeler = date de relance.
 */
export function computeCommercialSlaFields(input: CommercialSlaComputeInput): CommercialSlaFields {
  if (input.outcome !== "pending" || input.commercialPipelineStatus === "converted") {
    return { slaDueAt: null, slaWindowStartAt: null, slaStatus: null };
  }

  const nowMs = input.now.getTime();
  const assigned = parseDate(input.assignedAt);
  const lastAct = parseDate(input.lastActivityAt) ?? assigned;
  const status = input.commercialPipelineStatus;

  if (status === "new") {
    if (!assigned) {
      return { slaDueAt: null, slaWindowStartAt: null, slaStatus: null };
    }
    const startMs = assigned.getTime();
    const dueMs = startMs + NEW_MS;
    return computeStatusFromDueAndStart(startMs, dueMs, nowMs);
  }

  if (status === "contacted") {
    if (!lastAct) {
      return { slaDueAt: null, slaWindowStartAt: null, slaStatus: null };
    }
    const startMs = lastAct.getTime();
    const dueMs = startMs + CONTACTED_MS;
    return computeStatusFromDueAndStart(startMs, dueMs, nowMs);
  }

  if (status === "follow_up") {
    const next = parseDate(input.nearestNextActionAt);
    if (next) {
      const startMs = lastAct?.getTime() ?? assigned?.getTime() ?? nowMs;
      const dueMs = next.getTime();
      return computeStatusFromDueAndStart(startMs, dueMs, nowMs);
    }
    if (!lastAct) {
      return { slaDueAt: null, slaWindowStartAt: null, slaStatus: null };
    }
    const startMs = lastAct.getTime();
    const dueMs = startMs + CONTACTED_MS;
    return computeStatusFromDueAndStart(startMs, dueMs, nowMs);
  }

  return { slaDueAt: null, slaWindowStartAt: null, slaStatus: null };
}
