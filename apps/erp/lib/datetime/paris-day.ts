const TZ = "Europe/Paris";

/** Date locale YYYY-MM-DD (Paris). */
export function ymdParis(ms: number): string {
  return new Date(ms).toLocaleDateString("sv-SE", { timeZone: TZ });
}

/** Premier instant (ms UTC) du jour calendaire `ymd` à Paris. */
export function firstInstantOfParisYmd(ymd: string): number {
  const [y, mo, d] = ymd.split("-").map(Number);
  let lo = Date.UTC(y, mo - 1, d - 2, 0, 0, 0);
  let hi = Date.UTC(y, mo - 1, d + 2, 0, 0, 0);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (ymdParis(mid) < ymd) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Jour calendaire suivant après `ymd` (Paris). */
export function nextParisYmd(ymd: string): string {
  const startMs = firstInstantOfParisYmd(ymd);
  let probe = startMs + 3600 * 1000;
  while (ymdParis(probe) === ymd && probe - startMs < 40 * 3600 * 1000) {
    probe += 3600 * 1000;
  }
  return ymdParis(probe);
}

/**
 * Bornes [startIso, endIso) pour le jour calendaire courant à Paris (timestamptz).
 */
export function getParisDayRangeIso(now = new Date()): { startIso: string; endIso: string } {
  const target = ymdParis(now.getTime());
  const startMs = firstInstantOfParisYmd(target);
  const nextYmd = nextParisYmd(target);
  const endMs = firstInstantOfParisYmd(nextYmd);
  return { startIso: new Date(startMs).toISOString(), endIso: new Date(endMs).toISOString() };
}

/** Jour calendaire unique (Paris) : [startIso, endIso). */
export function getParisDayRangeIsoForYmd(ymd: string): { startIso: string; endIso: string } {
  const startMs = firstInstantOfParisYmd(ymd);
  const nextYmd = nextParisYmd(ymd);
  const endMs = firstInstantOfParisYmd(nextYmd);
  return { startIso: new Date(startMs).toISOString(), endIso: new Date(endMs).toISOString() };
}

/** Libellé long du jour (Paris), pour le tableau de bord. */
export function formatTodayLabelParis(now = new Date()): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(now);
}
