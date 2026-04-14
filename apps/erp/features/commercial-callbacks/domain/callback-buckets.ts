import {
  calendarDateInParis,
  isCallbackDueNow,
  isCallbackDueToday,
  isCallbackOverdue,
  isTerminalCallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-dates";
import { computeCallbackPriorityScore } from "@/features/commercial-callbacks/domain/priority-score";
import { compareCallbacksForAgentExecution } from "@/features/commercial-callbacks/lib/callback-scoring";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

export type CallbackSectionBucket = "overdue" | "today" | "upcoming";

export type CallbackVisualTier = "critical" | "important" | "normal";

export function getCallbackVisualTier(
  row: CommercialCallbackRow,
  now: Date = new Date(),
): CallbackVisualTier {
  if (isTerminalCallbackStatus(row.status)) {
    return "normal";
  }
  if (isCallbackOverdue(row.status, row.callback_date, row.callback_time, now)) {
    return "critical";
  }
  if (isCallbackDueToday(row.status, row.callback_date, row.callback_time, now)) {
    return "important";
  }
  return "normal";
}

export function callbackSectionBucket(
  row: CommercialCallbackRow,
  now: Date = new Date(),
): CallbackSectionBucket | null {
  if (isTerminalCallbackStatus(row.status)) {
    return null;
  }
  if (isCallbackOverdue(row.status, row.callback_date, row.callback_time, now)) {
    return "overdue";
  }
  if (isCallbackDueToday(row.status, row.callback_date, row.callback_time, now)) {
    return "today";
  }
  return "upcoming";
}

export function partitionCallbacksBySection(
  rows: CommercialCallbackRow[],
  now: Date = new Date(),
): Record<CallbackSectionBucket, CommercialCallbackRow[]> {
  const overdue: CommercialCallbackRow[] = [];
  const today: CommercialCallbackRow[] = [];
  const upcoming: CommercialCallbackRow[] = [];

  for (const row of rows) {
    const b = callbackSectionBucket(row, now);
    if (b === "overdue") overdue.push(row);
    else if (b === "today") today.push(row);
    else if (b === "upcoming") upcoming.push(row);
  }

  const sortFn = (a: CommercialCallbackRow, b: CommercialCallbackRow) =>
    computeCallbackPriorityScore(b, now) - computeCallbackPriorityScore(a, now);

  overdue.sort(sortFn);
  today.sort(sortFn);
  upcoming.sort(sortFn);

  return { overdue, today, upcoming };
}

/** Onglets agent : sans chevauchement (jour J vs jours passés). */
export type AgentCallbackTabKey = "due_now" | "today" | "overdue" | "upcoming" | "archive";

export function partitionAgentCallbackViews(
  rows: CommercialCallbackRow[],
  now: Date = new Date(),
): Record<AgentCallbackTabKey, CommercialCallbackRow[]> {
  const dueNow: CommercialCallbackRow[] = [];
  const todayLater: CommercialCallbackRow[] = [];
  const overduePast: CommercialCallbackRow[] = [];
  const upcoming: CommercialCallbackRow[] = [];
  const archive: CommercialCallbackRow[] = [];

  const todayYmd = calendarDateInParis(now);

  for (const row of rows) {
    if (isTerminalCallbackStatus(row.status)) {
      archive.push(row);
      continue;
    }
    if (row.callback_date > todayYmd) {
      upcoming.push(row);
      continue;
    }
    if (row.callback_date < todayYmd) {
      overduePast.push(row);
      continue;
    }
    if (isCallbackDueNow(row.status, row.callback_date, row.callback_time, now)) {
      dueNow.push(row);
    } else if (isCallbackDueToday(row.status, row.callback_date, row.callback_time, now)) {
      todayLater.push(row);
    } else {
      dueNow.push(row);
    }
  }

  const sortFn = (a: CommercialCallbackRow, b: CommercialCallbackRow) =>
    compareCallbacksForAgentExecution(a, b, now);

  dueNow.sort(sortFn);
  todayLater.sort(sortFn);
  overduePast.sort(sortFn);
  upcoming.sort(sortFn);
  archive.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return {
    due_now: dueNow,
    today: todayLater,
    overdue: overduePast,
    upcoming,
    archive,
  };
}
