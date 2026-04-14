/** Fuseau pour « aujourd’hui » / échéance (aligné plan métier). */
export const CALLBACK_TIMEZONE = "Europe/Paris";

const ACTIVE_FOR_REMINDER = new Set([
  "pending",
  "due_today",
  "overdue",
  "rescheduled",
  "in_progress",
  "no_answer",
  "cold_followup",
]);

/** Date locale YYYY-MM-DD à Paris (pour comparer à `callback_date` venant de la base). */
export function calendarDateInParis(isoNow: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: CALLBACK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(isoNow);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !d) return isoNow.toISOString().slice(0, 10);
  return `${y}-${m}-${d}`;
}

/** Minutes depuis minuit à Paris pour `isoNow`. */
export function minutesSinceMidnightParis(isoNow: Date): number {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: CALLBACK_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(isoNow);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const min = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + min;
}

/** Parse `HH:MM:SS` ou `HH:MM` retourné par Postgres pour `time`. */
export function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t || !t.trim()) return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

export function isCallbackActiveStatus(status: string): boolean {
  return ACTIVE_FOR_REMINDER.has(status);
}

/** Rappel « à traiter aujourd’hui » (échéance jour = aujourd’hui, pas encore en retard). */
export function isCallbackDueToday(
  status: string,
  callbackDate: string,
  callbackTime: string | null,
  isoNow: Date = new Date(),
): boolean {
  if (status === "overdue") return false;
  if (status === "due_today") return true;
  if (!isCallbackActiveStatus(status)) return false;
  const today = calendarDateInParis(isoNow);
  if (callbackDate !== today) return false;
  if (isCallbackOverdue(status, callbackDate, callbackTime, isoNow)) return false;
  return true;
}

/**
 * Rappel à traiter « maintenant » : en retard, ou bien échéance aujourd’hui
 * sans heure précise, ou créneau dans les 2 prochaines heures (ou dépassé le même jour).
 */
export function isCallbackDueNow(
  status: string,
  callbackDate: string,
  callbackTime: string | null,
  isoNow: Date = new Date(),
): boolean {
  if (isTerminalCallbackStatus(status)) return false;
  if (!isCallbackActiveStatus(status)) return false;
  if (isCallbackOverdue(status, callbackDate, callbackTime, isoNow)) return true;
  if (!isCallbackDueToday(status, callbackDate, callbackTime, isoNow)) return false;
  const minsDue = parseTimeToMinutes(callbackTime);
  if (minsDue == null) return true;
  const minsNow = minutesSinceMidnightParis(isoNow);
  return minsDue - minsNow <= 120;
}

/**
 * En retard : statut actif et (date passée, ou même jour avec heure dépassée).
 * Sans heure le jour J : considéré comme dû toute la journée → pas « en retard » avant le lendemain.
 */
export function isCallbackOverdue(
  status: string,
  callbackDate: string,
  callbackTime: string | null,
  isoNow: Date = new Date(),
): boolean {
  if (status === "overdue") return true;
  if (status === "due_today") return false;
  if (!isCallbackActiveStatus(status)) return false;
  const today = calendarDateInParis(isoNow);
  if (callbackDate < today) return true;
  if (callbackDate > today) return false;
  const minsNow = minutesSinceMidnightParis(isoNow);
  const minsDue = parseTimeToMinutes(callbackTime);
  if (minsDue == null) return false;
  return minsNow > minsDue;
}

export type CallbackListFilter = "today" | "upcoming" | "overdue" | "completed" | "all";

const TERMINAL = new Set(["completed", "cancelled", "converted_to_lead"]);

export function isTerminalCallbackStatus(status: string): boolean {
  return TERMINAL.has(status);
}

export function matchesCallbackFilter(
  row: { status: string; callback_date: string; callback_time: string | null },
  filter: CallbackListFilter,
  isoNow: Date = new Date(),
): boolean {
  if (filter === "all") return true;
  if (filter === "completed") return isTerminalCallbackStatus(row.status);
  if (isTerminalCallbackStatus(row.status)) return false;
  if (filter === "overdue") {
    return isCallbackOverdue(row.status, row.callback_date, row.callback_time, isoNow);
  }
  if (filter === "today") {
    return isCallbackDueToday(row.status, row.callback_date, row.callback_time, isoNow);
  }
  if (filter === "upcoming") {
    const today = calendarDateInParis(isoNow);
    if (row.callback_date > today) return true;
    if (row.callback_date < today) return false;
    return !isCallbackOverdue(row.status, row.callback_date, row.callback_time, isoNow);
  }
  return true;
}
