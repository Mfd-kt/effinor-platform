import {
  calendarDateInParis,
  isCallbackDueToday,
  isCallbackOverdue,
  isTerminalCallbackStatus,
  matchesCallbackFilter,
  type CallbackListFilter,
} from "@/features/commercial-callbacks/domain/callback-dates";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

export function filterCommercialCallbacks(
  rows: CommercialCallbackRow[],
  filter: CallbackListFilter,
  now: Date = new Date(),
): CommercialCallbackRow[] {
  return rows.filter((r) => matchesCallbackFilter(r, filter, now));
}

export type CommercialCallbackKpis = {
  dueToday: number;
  overdue: number;
  upcoming: number;
  completedToday: number;
};

export type CallbackPerformanceStats = {
  /** Part des rappels convertis parmi les rappels à un état terminal (tous temps, liste courante). */
  conversionRate: number | null;
  /** Part des lignes avec au moins une tentative sans réponse ou relance froide. */
  noAnswerOrColdShare: number | null;
  /** Rappels clôturés (terminal) mis à jour aujourd’hui. */
  treatedToday: number;
};

function addDaysIsoDate(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const dt = new Date(utc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function computeCommercialCallbackKpis(
  rows: CommercialCallbackRow[],
  now: Date = new Date(),
): CommercialCallbackKpis {
  const today = calendarDateInParis(now);
  const upcomingUntil = addDaysIsoDate(today, 7);

  let dueToday = 0;
  let overdue = 0;
  let upcoming = 0;
  let completedToday = 0;

  for (const r of rows) {
    if (isTerminalCallbackStatus(r.status)) {
      if (calendarDateInParis(new Date(r.updated_at)) === today) {
        completedToday += 1;
      }
      continue;
    }
    if (isCallbackOverdue(r.status, r.callback_date, r.callback_time, now)) {
      overdue += 1;
    } else if (isCallbackDueToday(r.status, r.callback_date, r.callback_time, now)) {
      dueToday += 1;
    } else if (
      matchesCallbackFilter(r, "upcoming", now) &&
      r.callback_date <= upcomingUntil
    ) {
      upcoming += 1;
    }
  }

  return { dueToday, overdue, upcoming, completedToday };
}

export function computeCallbackPerformanceStats(
  rows: CommercialCallbackRow[],
  now: Date = new Date(),
): CallbackPerformanceStats {
  const today = calendarDateInParis(now);
  const terminal = rows.filter((r) => isTerminalCallbackStatus(r.status));
  const converted = terminal.filter((r) => r.status === "converted_to_lead").length;
  const conversionRate = terminal.length > 0 ? converted / terminal.length : null;

  const withAttempts = rows.filter(
    (r) => (r.attempts_count ?? 0) > 0 || r.status === "cold_followup" || r.status === "no_answer",
  ).length;
  const noAnswerOrColdShare = rows.length > 0 ? withAttempts / rows.length : null;

  const treatedToday = rows.filter(
    (r) =>
      isTerminalCallbackStatus(r.status) && calendarDateInParis(new Date(r.updated_at)) === today,
  ).length;

  return { conversionRate, noAnswerOrColdShare, treatedToday };
}
