import { CALLBACK_TIMEZONE } from "@/features/commercial-callbacks/domain/callback-dates";

export const QUICK_RESCHEDULE_PRESETS = [
  "plus_30m",
  "plus_1h",
  "plus_2h",
  "tomorrow_morning",
  "tomorrow_afternoon",
  "next_week",
] as const;

export type QuickReschedulePreset = (typeof QUICK_RESCHEDULE_PRESETS)[number];

export const QUICK_RESCHEDULE_LABELS: Record<QuickReschedulePreset, string> = {
  plus_30m: "+30 min",
  plus_1h: "+1 h",
  plus_2h: "+2 h",
  tomorrow_morning: "Demain matin",
  tomorrow_afternoon: "Demain après-midi",
  next_week: "Semaine prochaine",
};

/** Retourne `callback_date` (YYYY-MM-DD) et `callback_time` (HH:MM:SS) fuseau Paris. */
export function computeQuickRescheduleParis(
  preset: QuickReschedulePreset,
  now: Date = new Date(),
): { callback_date: string; callback_time: string | null } {
  const base = new Date(now.getTime());

  switch (preset) {
    case "plus_30m":
      base.setTime(base.getTime() + 30 * 60 * 1000);
      return splitParisDateTime(base);
    case "plus_1h":
      base.setTime(base.getTime() + 60 * 60 * 1000);
      return splitParisDateTime(base);
    case "plus_2h":
      base.setTime(base.getTime() + 2 * 60 * 60 * 1000);
      return splitParisDateTime(base);
    case "tomorrow_morning": {
      const t = addCalendarDaysParis(now, 1);
      return { callback_date: t, callback_time: "09:00:00" };
    }
    case "tomorrow_afternoon": {
      const t = addCalendarDaysParis(now, 1);
      return { callback_date: t, callback_time: "14:00:00" };
    }
    case "next_week": {
      const ymd = addCalendarDaysParis(now, 7);
      const { callback_time } = splitParisDateTime(now);
      return { callback_date: ymd, callback_time };
    }
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}

function splitParisDateTime(d: Date): { callback_date: string; callback_time: string | null } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CALLBACK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const hh = parts.find((p) => p.type === "hour")?.value;
  const min = parts.find((p) => p.type === "minute")?.value;
  const ss = parts.find((p) => p.type === "second")?.value;
  if (!y || !m || !day) {
    return { callback_date: d.toISOString().slice(0, 10), callback_time: null };
  }
  const ymd = `${y}-${m}-${day}`;
  if (!hh || !min || !ss) {
    return { callback_date: ymd, callback_time: null };
  }
  const h2 = hh.padStart(2, "0");
  const m2 = min.padStart(2, "0");
  const s2 = ss.padStart(2, "0");
  return { callback_date: ymd, callback_time: `${h2}:${m2}:${s2}` };
}

function addCalendarDaysParis(isoNow: Date, days: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CALLBACK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(isoNow);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  const utc = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const dt = new Date(utc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
