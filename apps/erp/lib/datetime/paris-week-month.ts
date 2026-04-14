import {
  firstInstantOfParisYmd,
  nextParisYmd,
  ymdParis,
} from "@/lib/datetime/paris-day";

const TZ = "Europe/Paris";

/** Jour calendaire précédent (Paris). */
export function previousParisYmd(ymd: string): string {
  const startMs = firstInstantOfParisYmd(ymd);
  return ymdParis(startMs - 1);
}

export function addParisDays(ymd: string, delta: number): string {
  let y = ymd;
  const step = delta > 0 ? 1 : -1;
  for (let i = 0; i < Math.abs(delta); i++) {
    y = step > 0 ? nextParisYmd(y) : previousParisYmd(y);
  }
  return y;
}

function isParisMonday(ymd: string): boolean {
  const ms = firstInstantOfParisYmd(ymd) + 12 * 3600000;
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(ms) === "Mon";
}

/** Lundi (Paris) de la semaine qui contient `ymd`. */
export function getParisMondayYmdForDate(ymd: string): string {
  let y = ymd;
  for (let i = 0; i < 7; i++) {
    if (isParisMonday(y)) return y;
    y = previousParisYmd(y);
  }
  return ymd;
}

function formatParisDayShort(ymd: string): string {
  const ms = firstInstantOfParisYmd(ymd) + 12 * 3600000;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(ms);
}

/** Jour calendaire précédent (Paris) : [00:00 ; lendemain 00:00). */
export function getParisYesterdayRangeIso(now = new Date()): {
  startIso: string;
  endIso: string;
  /** Libellé court du jour d’avant (ex. « mer. 2 avr. »). */
  labelShort: string;
} {
  const todayYmd = ymdParis(now.getTime());
  const yesterdayYmd = previousParisYmd(todayYmd);
  const startMs = firstInstantOfParisYmd(yesterdayYmd);
  const nextYmd = nextParisYmd(yesterdayYmd);
  const endMs = firstInstantOfParisYmd(nextYmd);
  const labelShort = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(new Date(startMs + 12 * 3600000));
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
    labelShort,
  };
}

/** Semaine ouvrée précédente (lun.–ven.), celle d’avant la semaine en cours. */
export function getParisPreviousWeekMonFriRangeIso(now = new Date()): {
  startIso: string;
  endIso: string;
  labelShort: string;
} {
  const todayYmd = ymdParis(now.getTime());
  const mondayYmd = getParisMondayYmdForDate(todayYmd);
  const prevMondayYmd = addParisDays(mondayYmd, -7);
  const prevFridayYmd = addParisDays(prevMondayYmd, 4);
  const prevSaturdayYmd = addParisDays(prevMondayYmd, 5);
  const startMs = firstInstantOfParisYmd(prevMondayYmd);
  const endMs = firstInstantOfParisYmd(prevSaturdayYmd);
  const a = formatParisDayShort(prevMondayYmd);
  const b = formatParisDayShort(prevFridayYmd);
  const yStr = prevMondayYmd.slice(0, 4);
  const labelShort = `${a} – ${b} ${yStr}`;
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
    labelShort,
  };
}

/** Mois civil précédent (Paris). */
export function getParisPreviousMonthRangeIso(now = new Date()): {
  startIso: string;
  endIso: string;
  labelMonth: string;
} {
  const ymd = ymdParis(now.getTime());
  const firstCurrent = firstOfParisMonthContaining(ymd);
  const prevMonthFirst = addParisCalendarMonthsFirst(firstCurrent, -1);
  const startMs = firstInstantOfParisYmd(prevMonthFirst);
  const endMs = firstInstantOfParisYmd(firstCurrent);
  const labelMonth = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(startMs + 12 * 3600000));
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
    labelMonth,
  };
}

/** Plage [lun. 00:00 ; sam. 00:00) = jours ouvrés lun.–ven. */
export function getParisWeekMonFriRangeIso(now = new Date()): {
  startIso: string;
  endIso: string;
  labelShort: string;
} {
  const todayYmd = ymdParis(now.getTime());
  const mondayYmd = getParisMondayYmdForDate(todayYmd);
  const fridayYmd = addParisDays(mondayYmd, 4);
  const saturdayYmd = addParisDays(mondayYmd, 5);
  const startMs = firstInstantOfParisYmd(mondayYmd);
  const endMs = firstInstantOfParisYmd(saturdayYmd);
  const a = formatParisDayShort(mondayYmd);
  const b = formatParisDayShort(fridayYmd);
  const yStr = mondayYmd.slice(0, 4);
  const labelShort = `${a} – ${b} ${yStr}`;
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
    labelShort,
  };
}

function firstOfParisMonthContaining(ymd: string): string {
  const [y, m] = ymd.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

function addParisCalendarMonthsFirst(ymdFirst: string, delta: number): string {
  const [y, m] = ymdFirst.split("-").map(Number);
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

export function getParisMonthRangeIso(now = new Date()): {
  startIso: string;
  endIso: string;
  labelMonth: string;
} {
  const ymd = ymdParis(now.getTime());
  const firstYmd = firstOfParisMonthContaining(ymd);
  const nextFirst = addParisCalendarMonthsFirst(firstYmd, 1);
  const startMs = firstInstantOfParisYmd(firstYmd);
  const endMs = firstInstantOfParisYmd(nextFirst);
  const labelMonth = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(startMs + 12 * 3600000));
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
    labelMonth,
  };
}

/** lun.–ven. de la semaine courante (Paris), pour graphique par jour. */
export function getParisCurrentWeekMonFriYmds(now = new Date()): string[] {
  const mon = getParisMondayYmdForDate(ymdParis(now.getTime()));
  return [0, 1, 2, 3, 4].map((d) => addParisDays(mon, d));
}

function formatWeekSpanLabel(mondayYmd: string, sundayYmd: string): string {
  const a = formatParisDayShort(mondayYmd);
  const b = formatParisDayShort(sundayYmd);
  const y = mondayYmd.slice(0, 4);
  return `${a} – ${b} ${y}`;
}

/** 8 semaines : la semaine courante (lun.→dim.) puis les 7 précédentes. */
export function getParisLast8WeekBuckets(now = new Date()): {
  label: string;
  startIso: string;
  endIso: string;
}[] {
  const mondayYmd = getParisMondayYmdForDate(ymdParis(now.getTime()));
  const out: { label: string; startIso: string; endIso: string }[] = [];
  for (let w = 0; w < 8; w++) {
    const mYmd = addParisDays(mondayYmd, -7 * w);
    const sundayYmd = addParisDays(mYmd, 6);
    const nextMondayYmd = addParisDays(mYmd, 7);
    const startMs = firstInstantOfParisYmd(mYmd);
    const endMs = firstInstantOfParisYmd(nextMondayYmd);
    out.push({
      label: formatWeekSpanLabel(mYmd, sundayYmd),
      startIso: new Date(startMs).toISOString(),
      endIso: new Date(endMs).toISOString(),
    });
  }
  return out;
}

/** 6 derniers mois civils (Paris), du plus ancien au plus récent pour l’axe X. */
export function getParisLast6MonthBuckets(now = new Date()): {
  label: string;
  startIso: string;
  endIso: string;
}[] {
  const ymd = ymdParis(now.getTime());
  let first = firstOfParisMonthContaining(ymd);
  const raw: { label: string; startIso: string; endIso: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const nextFirst = addParisCalendarMonthsFirst(first, 1);
    const startMs = firstInstantOfParisYmd(first);
    const endMs = firstInstantOfParisYmd(nextFirst);
    const label = new Intl.DateTimeFormat("fr-FR", {
      month: "short",
      year: "numeric",
      timeZone: TZ,
    }).format(new Date(startMs + 12 * 3600000));
    raw.push({
      label,
      startIso: new Date(startMs).toISOString(),
      endIso: new Date(endMs).toISOString(),
    });
    first = addParisCalendarMonthsFirst(first, -1);
  }
  return raw.reverse();
}

/** Libellé court jour (lun., mar., …) pour un jour Paris. */
export function formatParisWeekdayShort(ymd: string): string {
  const ms = firstInstantOfParisYmd(ymd) + 12 * 3600000;
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: TZ }).format(ms);
}
