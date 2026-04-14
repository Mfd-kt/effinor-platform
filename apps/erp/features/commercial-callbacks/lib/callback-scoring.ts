import {
  calendarDateInParis,
  isCallbackDueToday,
  isCallbackOverdue,
  isTerminalCallbackStatus,
  minutesSinceMidnightParis,
  parseTimeToMinutes,
} from "@/features/commercial-callbacks/domain/callback-dates";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

export type CallbackScoreBand = "critical" | "high" | "normal" | "low";

const REASON_HOT = /intéress|devis|rappel|urgent|chiffrage|projet|signer|valider|ok pour/i;

export type CallbackScoringContext = {
  /** Fiche CEE stratégique (bonus léger). */
  strategicCeeSheet?: boolean;
};

/** Score métier 0–100 + niveau visuel. */
export function computeCommercialCallbackScore(
  row: CommercialCallbackRow,
  now: Date = new Date(),
  context: CallbackScoringContext = {},
): { businessScore: number; band: CallbackScoreBand; confidenceScore: number } {
  if (isTerminalCallbackStatus(row.status)) {
    return { businessScore: 0, band: "low", confidenceScore: 0 };
  }

  let score = 0;

  if (row.status === "overdue" || isCallbackOverdue(row.status, row.callback_date, row.callback_time, now)) {
    score += 42;
  } else if (row.status === "due_today" || isCallbackDueToday(row.status, row.callback_date, row.callback_time, now)) {
    score += 32;
  } else {
    score += 12;
  }

  const today = calendarDateInParis(now);
  const dueSoonHours = hoursUntilDue(row, now);
  if (dueSoonHours != null && dueSoonHours >= 0 && dueSoonHours <= 2) {
    score += 18;
  }

  const reason = `${row.callback_reason ?? ""} ${row.call_context_summary ?? ""} ${row.callback_comment ?? ""}`;
  if (REASON_HOT.test(reason)) {
    score += 12;
  }

  const attempts = row.attempts_count ?? 0;
  score -= Math.min(attempts * 4, 20);

  if (row.status === "cold_followup") {
    score -= 15;
  }
  if (row.status === "cancelled") {
    score = 0;
  }

  const eur =
    row.estimated_value_eur != null && !Number.isNaN(Number(row.estimated_value_eur))
      ? Number(row.estimated_value_eur)
      : row.estimated_value_cents != null
        ? row.estimated_value_cents / 100
        : 0;
  if (eur > 0) {
    score += Math.min(18, Math.log10(eur + 10) * 6);
  }

  if (context.strategicCeeSheet) {
    score += 6;
  }

  const lastCall = row.last_call_at ? new Date(row.last_call_at).getTime() : 0;
  if (lastCall > 0) {
    const hoursSince = (now.getTime() - lastCall) / 3_600_000;
    if (hoursSince < 2) {
      score -= 6;
    }
  }

  switch (row.priority) {
    case "critical":
      score += 14;
      break;
    case "high":
      score += 10;
      break;
    case "low":
      score -= 6;
      break;
    default:
      break;
  }

  switch (row.prospect_temperature) {
    case "hot":
      score += 10;
      break;
    case "warm":
      score += 4;
      break;
    case "cold":
      score -= 6;
      break;
    default:
      break;
  }

  if (row.status === "in_progress") {
    score += 6;
  }

  const businessScore = Math.min(100, Math.max(0, Math.round(score)));
  const band = bandFromScore(businessScore);
  const confidenceScore = Math.min(100, Math.max(0, 70 + (attempts > 2 ? -10 : 0)));

  return { businessScore, band, confidenceScore };
}

function bandFromScore(s: number): CallbackScoreBand {
  if (s >= 85) return "critical";
  if (s >= 65) return "high";
  if (s >= 35) return "normal";
  return "low";
}

/** Heures jusqu’à l’échéance du jour J (approx.) ; négatif = heure dépassée. */
function hoursUntilDue(row: CommercialCallbackRow, now: Date): number | null {
  const today = calendarDateInParis(now);
  if (row.callback_date < today) return -1;
  if (row.callback_date > today) {
    const a = Date.UTC(
      Number(row.callback_date.slice(0, 4)),
      Number(row.callback_date.slice(5, 7)) - 1,
      Number(row.callback_date.slice(8, 10)),
    );
    const b = Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)));
    return (a - b) / 3_600_000;
  }
  const minsNow = minutesSinceMidnightParis(now);
  const minsDue = parseTimeToMinutes(row.callback_time);
  if (minsDue == null) return 4;
  return (minsDue - minsNow) / 60;
}

/** Tri agent : overdue > due_today > score > valeur. */
export function compareCallbacksForAgentExecution(
  a: CommercialCallbackRow,
  b: CommercialCallbackRow,
  now: Date = new Date(),
): number {
  const rank = (r: CommercialCallbackRow) => {
    if (r.status === "overdue" || isCallbackOverdue(r.status, r.callback_date, r.callback_time, now)) return 0;
    if (r.status === "due_today" || isCallbackDueToday(r.status, r.callback_date, r.callback_time, now)) return 1;
    return 2;
  };
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;

  const sa = a.business_score ?? computeCommercialCallbackScore(a, now).businessScore;
  const sb = b.business_score ?? computeCommercialCallbackScore(b, now).businessScore;
  if (sa !== sb) return sb - sa;

  const ea =
    a.estimated_value_eur != null
      ? Number(a.estimated_value_eur)
      : a.estimated_value_cents != null
        ? a.estimated_value_cents / 100
        : 0;
  const eb =
    b.estimated_value_eur != null
      ? Number(b.estimated_value_eur)
      : b.estimated_value_cents != null
        ? b.estimated_value_cents / 100
        : 0;
  if (ea !== eb) return eb - ea;

  return a.callback_date.localeCompare(b.callback_date);
}
