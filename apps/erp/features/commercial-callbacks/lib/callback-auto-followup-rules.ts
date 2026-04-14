import {
  calendarDateInParis,
  isCallbackDueToday,
  isCallbackOverdue,
  isTerminalCallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-dates";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

/** Types de relance suggérés pour le message et les logs. */
export type CallbackAutoFollowupSuggestedType =
  | "no_answer_followup"
  | "scheduling_followup"
  | "reminder_followup"
  | "callback_confirmation";

export type CallbackAutoFollowupUrgency = "low" | "normal" | "high";

export type CallbackAutoFollowupContext = {
  now: Date;
  /** Plafond d’e-mails auto par rappel (défaut 3). */
  maxAutoFollowups?: number;
  /** Délai minimum entre deux envois (heures, défaut 48). */
  minHoursBetweenSends?: number;
};

const DEFAULT_MAX = 3;
const DEFAULT_MIN_HOURS = 48;

/** Motifs d’opposition explicite (ne pas relancer). */
const OPPOSITION_RE =
  /refus\s+cat[ée]gorique|ne\s+pas\s+(rappeler|contacter|relancer)|stop\s*mail|d[ée]sinscrire|pas\s+int[ée]ress[ée]|hors\s+cible|faux\s+num[ée]ro|num[ée]ro\s+invalide/i;

/** Le prospect a demandé un écrit / e-mail. */
const ASKED_WRITE_RE =
  /(?:écrire|écris|mail|e-mail|email|message\s+écrit|envoyez|envoyer\s+par\s+mail|par\s+écrit)/i;

export function getMaxAutoFollowups(ctx: CallbackAutoFollowupContext): number {
  return ctx.maxAutoFollowups ?? DEFAULT_MAX;
}

export function getMinHoursBetweenSends(ctx: CallbackAutoFollowupContext): number {
  return ctx.minHoursBetweenSends ?? DEFAULT_MIN_HOURS;
}

function hasValidEmail(row: CommercialCallbackRow): boolean {
  const e = row.email?.trim();
  return !!e && e.includes("@");
}

function packText(row: CommercialCallbackRow): string {
  return `${row.callback_comment ?? ""} ${row.callback_reason ?? ""} ${row.callback_outcome ?? ""} ${row.call_context_summary ?? ""}`;
}

function hasOpposition(row: CommercialCallbackRow): boolean {
  return OPPOSITION_RE.test(packText(row));
}

function askedToWrite(row: CommercialCallbackRow): boolean {
  return ASKED_WRITE_RE.test(packText(row)) || ASKED_WRITE_RE.test(row.callback_outcome ?? "");
}

function hasPreferredPeriodForEmail(row: CommercialCallbackRow): boolean {
  const p = row.callback_preferred_period?.trim();
  if (!p) return false;
  return /matin|après-midi|après midi|fin\s+de\s+journée|journée|créneau/i.test(p);
}

/**
 * Cas métier : au moins un motif autorise une relance écrite automatique.
 */
function matchesAuthorizedBusinessCase(
  row: CommercialCallbackRow,
  now: Date,
): { match: boolean; suggestedType: CallbackAutoFollowupSuggestedType | null } {
  if (row.status === "no_answer") {
    return { match: true, suggestedType: "no_answer_followup" };
  }
  if (row.status === "rescheduled") {
    return { match: true, suggestedType: "scheduling_followup" };
  }
  if (askedToWrite(row)) {
    return { match: true, suggestedType: "callback_confirmation" };
  }
  if (hasPreferredPeriodForEmail(row) && hasValidEmail(row)) {
    return { match: true, suggestedType: "scheduling_followup" };
  }
  const due =
    row.status === "due_today" ||
    row.status === "overdue" ||
    isCallbackOverdue(row.status, row.callback_date, row.callback_time, now) ||
    isCallbackDueToday(row.status, row.callback_date, row.callback_time, now);
  if (due && (row.attempts_count ?? 0) >= 1 && hasValidEmail(row)) {
    return { match: true, suggestedType: "reminder_followup" };
  }
  return { match: false, suggestedType: null };
}

function urgencyFor(row: CommercialCallbackRow, now: Date): CallbackAutoFollowupUrgency {
  if (isCallbackOverdue(row.status, row.callback_date, row.callback_time, now)) return "high";
  if (row.status === "due_today" || isCallbackDueToday(row.status, row.callback_date, row.callback_time, now)) {
    return "normal";
  }
  return "low";
}

export type AutoFollowupEligibility = {
  eligible: boolean;
  /** Code stable pour logs / tests (snake_case). */
  reason: string | null;
  suggestedType: CallbackAutoFollowupSuggestedType | null;
  urgency: CallbackAutoFollowupUrgency;
};

/**
 * Règle principale : éligible uniquement si tous les garde-fous passent et un cas métier matche.
 */
export function isCallbackEligibleForAutoFollowup(
  row: CommercialCallbackRow,
  context: CallbackAutoFollowupContext,
): AutoFollowupEligibility {
  const now = context.now;
  const urgency = urgencyFor(row, now);

  if (isTerminalCallbackStatus(row.status)) {
    return { eligible: false, reason: "terminal_status", suggestedType: null, urgency };
  }
  if (row.status === "in_progress") {
    return { eligible: false, reason: "in_progress", suggestedType: null, urgency };
  }
  if (row.status === "cold_followup") {
    return { eligible: false, reason: "cold_followup_excluded", suggestedType: null, urgency };
  }
  if (!row.auto_followup_enabled) {
    return { eligible: false, reason: "auto_followup_disabled", suggestedType: null, urgency };
  }
  if (!hasValidEmail(row)) {
    return { eligible: false, reason: "no_email", suggestedType: null, urgency };
  }

  const max = getMaxAutoFollowups(context);
  if ((row.auto_followup_count ?? 0) >= max) {
    return { eligible: false, reason: "max_auto_followups_reached", suggestedType: null, urgency };
  }

  if (hasOpposition(row)) {
    return { eligible: false, reason: "prospect_opposition", suggestedType: null, urgency };
  }

  const last = row.auto_followup_last_sent_at ? new Date(row.auto_followup_last_sent_at) : null;
  const minH = getMinHoursBetweenSends(context);
  if (last) {
    const nextAllowed = new Date(last.getTime() + minH * 3_600_000);
    if (now < nextAllowed) {
      return { eligible: false, reason: "cooldown_active", suggestedType: null, urgency };
    }
  }

  const { match, suggestedType } = matchesAuthorizedBusinessCase(row, now);
  if (!match || !suggestedType) {
    return { eligible: false, reason: "no_matching_business_case", suggestedType: null, urgency };
  }

  return { eligible: true, reason: null, suggestedType, urgency };
}

/** Motif d’exclusion lisible (skip) — aligné sur `getCallbackAutoFollowupSkipReason`. */
export function getCallbackAutoFollowupSkipReason(
  row: CommercialCallbackRow,
  context: CallbackAutoFollowupContext,
): string | null {
  const r = isCallbackEligibleForAutoFollowup(row, context);
  return r.reason;
}

/**
 * Prochain instant théorique où un envoi auto peut être tenté (cooldown / plafond).
 */
export function computeNextCallbackAutoFollowupAt(
  row: CommercialCallbackRow,
  context: CallbackAutoFollowupContext,
): Date | null {
  const max = getMaxAutoFollowups(context);
  if (!row.auto_followup_enabled) return null;
  if (isTerminalCallbackStatus(row.status)) return null;
  if ((row.auto_followup_count ?? 0) >= max) return null;

  const minH = getMinHoursBetweenSends(context);
  const last = row.auto_followup_last_sent_at ? new Date(row.auto_followup_last_sent_at) : null;
  if (last) {
    return new Date(last.getTime() + minH * 3_600_000);
  }

  const skip = getCallbackAutoFollowupSkipReason(row, context);
  if (skip === "no_matching_business_case" || skip === "no_email") {
    return null;
  }

  return context.now;
}

/** Fenêtre de déduplication journalière pour clé stable (UTC date). */
export function autoFollowupDedupeDayBucket(iso: Date): string {
  return iso.toISOString().slice(0, 10);
}

/** Clé dédup : un envoi par rappel et par jour et par type suggéré. */
export function buildAutoFollowupDedupeKey(
  callbackId: string,
  suggestedType: CallbackAutoFollowupSuggestedType,
  dayBucket: string,
): string {
  return `callback-auto-followup:${callbackId}:${suggestedType}:${dayBucket}`;
}
