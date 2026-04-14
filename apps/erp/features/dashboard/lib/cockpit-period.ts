/**
 * Source de vérité temporelle du cockpit (Europe/Paris).
 * Toutes les fenêtres « courantes » se terminent à `now` (fin exclusive pour requêtes : created_at < endIso).
 */

import type { CockpitScopeFilters } from "@/features/dashboard/domain/cockpit";
import {
  firstInstantOfParisYmd,
  getParisDayRangeIso,
  nextParisYmd,
  ymdParis,
} from "@/lib/datetime/paris-day";
import {
  addParisDays,
  getParisMondayYmdForDate,
  getParisMonthRangeIso,
  getParisYesterdayRangeIso,
} from "@/lib/datetime/paris-week-month";

export const COCKPIT_TIMEZONE = "Europe/Paris" as const;

export type CockpitPeriod = CockpitScopeFilters["period"];

export type CockpitIsoRange = {
  startIso: string;
  endIso: string;
};

const MS_DAY = 86_400_000;

function firstOfParisMonthContainingYmd(ymd: string): string {
  const [y, m] = ymd.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

function addParisCalendarMonthsFirstYmd(firstYmd: string, delta: number): string {
  const [y, m] = firstYmd.split("-").map(Number);
  let y2 = y;
  let m2 = m + delta;
  while (m2 < 1) {
    m2 += 12;
    y2 -= 1;
  }
  while (m2 > 12) {
    m2 -= 12;
    y2 += 1;
  }
  return `${y2}-${String(m2).padStart(2, "0")}-01`;
}

/** Début de période (ISO) : aligné Paris (sauf `days30` = glissant UTC/ms). */
export function getCockpitPeriodStartIso(period: CockpitPeriod, now = new Date()): string {
  return getCockpitPeriodRange(period, now).startIso;
}

/**
 * Fenêtre cockpit courante [startIso, endIso) avec endIso = maintenant.
 * Les comptages utilisent en général : `>= startIso && < endIso`.
 */
export function getCockpitPeriodRange(period: CockpitPeriod, now = new Date()): CockpitIsoRange {
  const endIso = now.toISOString();
  if (period === "today") {
    const { startIso } = getParisDayRangeIso(now);
    return { startIso, endIso };
  }
  if (period === "week") {
    const todayYmd = ymdParis(now.getTime());
    const mondayYmd = getParisMondayYmdForDate(todayYmd);
    const startMs = firstInstantOfParisYmd(mondayYmd);
    return { startIso: new Date(startMs).toISOString(), endIso };
  }
  if (period === "month") {
    const { startIso } = getParisMonthRangeIso(now);
    return { startIso, endIso };
  }
  return {
    startIso: new Date(now.getTime() - 30 * MS_DAY).toISOString(),
    endIso,
  };
}

/**
 * Période précédente pour comparaisons de tendance (KPI, cartes).
 * - today → hier (jour civil Paris complet)
 * - week → semaine civile précédente [lundi préc., lundi courant)
 * - month → même durée écoulée sur le mois civil précédent (MTD vs MTD-1)
 * - days30 → les 30 jours précédant la fenêtre courante
 */
export function getCockpitPreviousPeriodRange(period: CockpitPeriod, now = new Date()): CockpitIsoRange {
  if (period === "today") {
    const y = getParisYesterdayRangeIso(now);
    return { startIso: y.startIso, endIso: y.endIso };
  }
  if (period === "week") {
    const todayYmd = ymdParis(now.getTime());
    const thisMondayYmd = getParisMondayYmdForDate(todayYmd);
    const prevMondayYmd = addParisDays(thisMondayYmd, -7);
    const startMs = firstInstantOfParisYmd(prevMondayYmd);
    const endMs = firstInstantOfParisYmd(thisMondayYmd);
    return {
      startIso: new Date(startMs).toISOString(),
      endIso: new Date(endMs).toISOString(),
    };
  }
  if (period === "month") {
    const ymd = ymdParis(now.getTime());
    const firstCurrent = firstOfParisMonthContainingYmd(ymd);
    const startCurrentMs = firstInstantOfParisYmd(firstCurrent);
    const elapsedMs = now.getTime() - startCurrentMs;
    const prevFirst = addParisCalendarMonthsFirstYmd(firstCurrent, -1);
    const prevStartMs = firstInstantOfParisYmd(prevFirst);
    return {
      startIso: new Date(prevStartMs).toISOString(),
      endIso: new Date(prevStartMs + elapsedMs).toISOString(),
    };
  }
  const currentStartMs = now.getTime() - 30 * MS_DAY;
  return {
    startIso: new Date(currentStartMs - 30 * MS_DAY).toISOString(),
    endIso: new Date(currentStartMs).toISOString(),
  };
}

export function getCockpitPeriodLabel(period: CockpitPeriod): string {
  switch (period) {
    case "today":
      return "Aujourd’hui";
    case "week":
      return "Semaine en cours";
    case "month":
      return "Mois en cours";
    case "days30":
      return "30 derniers jours";
  }
}

/** Libellé court pour la période de comparaison. */
export function getCockpitComparisonPeriodLabel(period: CockpitPeriod): string {
  switch (period) {
    case "today":
      return "Hier";
    case "week":
      return "Semaine précédente";
    case "month":
      return "Même période le mois précédent";
    case "days30":
      return "30 jours précédents";
  }
}

/** Libellé UI détaillé (sous-titres cartes / graphiques). */
export function getCockpitPeriodDetailLabel(period: CockpitPeriod, now = new Date()): string {
  if (period === "today") {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: COCKPIT_TIMEZONE,
    }).format(now);
  }
  if (period === "week") {
    const todayYmd = ymdParis(now.getTime());
    const mon = getParisMondayYmdForDate(todayYmd);
    const sun = addParisDays(mon, 6);
    const a = formatParisDayShort(mon);
    const b = formatParisDayShort(sun);
    return `${a} – ${b} ${mon.slice(0, 4)} · jusqu’à maintenant`;
  }
  if (period === "month") {
    const { labelMonth } = getParisMonthRangeIso(now);
    return `${labelMonth} · jusqu’à maintenant`;
  }
  return "Glissant · jusqu’à maintenant";
}

function formatParisDayShort(ymd: string): string {
  const ms = firstInstantOfParisYmd(ymd) + 12 * 3600000;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: COCKPIT_TIMEZONE,
  }).format(ms);
}

export function isDateInCockpitPeriod(isoDate: string, period: CockpitPeriod, now = new Date()): boolean {
  const { startIso, endIso } = getCockpitPeriodRange(period, now);
  return isoDate >= startIso && isoDate < endIso;
}

/**
 * Découpe la période en buckets journaliers Paris [start,end) pour graphiques (inclus start, exclus min(end, nowDayNext)).
 */
export function listParisDayBucketRangesInCockpitPeriod(
  period: CockpitPeriod,
  now = new Date(),
): { startIso: string; endIso: string; label: string }[] {
  const { startIso, endIso } = getCockpitPeriodRange(period, now);
  const endMs = new Date(endIso).getTime();
  let ymd = ymdParis(new Date(startIso).getTime());
  const out: { startIso: string; endIso: string; label: string }[] = [];
  while (true) {
    const dayStart = firstInstantOfParisYmd(ymd);
    if (dayStart >= endMs) break;
    const nextYmd = nextParisYmd(ymd);
    const dayEnd = firstInstantOfParisYmd(nextYmd);
    const bucketEnd = Math.min(dayEnd, endMs);
    if (bucketEnd > dayStart) {
      out.push({
        startIso: new Date(dayStart).toISOString(),
        endIso: new Date(bucketEnd).toISOString(),
        label: formatParisDayShort(ymd),
      });
    }
    ymd = nextYmd;
  }
  return out;
}

/**
 * Aujourd’hui : buckets ~3h depuis minuit Paris jusqu’à maintenant (max 8 barres).
 */
export function listTodayHourBuckets(now = new Date()): { startIso: string; endIso: string; label: string }[] {
  const ymd = ymdParis(now.getTime());
  const dayStart = firstInstantOfParisYmd(ymd);
  const endMs = now.getTime();
  const span = Math.max(1, endMs - dayStart);
  const n = 8;
  const step = span / n;
  const out: { startIso: string; endIso: string; label: string }[] = [];
  for (let i = 0; i < n; i++) {
    const s = dayStart + Math.floor(i * step);
    const e = i === n - 1 ? endMs : dayStart + Math.floor((i + 1) * step);
    if (e <= s) continue;
    const h0 = new Date(s).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: COCKPIT_TIMEZONE });
    const h1 = new Date(e).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: COCKPIT_TIMEZONE });
    out.push({
      startIso: new Date(s).toISOString(),
      endIso: new Date(e).toISOString(),
      label: `${h0}–${h1}`,
    });
  }
  return out;
}
