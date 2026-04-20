const PARIS = "Europe/Paris";

function parisYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function parisHm(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Bornes UTC [start, end] du jour civil courant à Paris (pour filtrer `next_action_at`, etc.).
 * Recherche par pas d’une minute sur une fenêtre large — correct été/hiver.
 */
export function getParisTodayBoundsIso(now: Date = new Date()): { startIso: string; endIso: string } {
  const targetYmd = parisYmd(now);
  const startMin = Math.floor((now.getTime() - 40 * 3600000) / 60000);

  for (let i = 0; i < 52 * 60; i++) {
    const ms = (startMin + i) * 60000;
    const d = new Date(ms);
    if (parisYmd(d) === targetYmd && parisHm(d) === "00:00") {
      return {
        startIso: d.toISOString(),
        endIso: new Date(ms + 86400000 - 1000).toISOString(),
      };
    }
  }

  const mid = now.toISOString();
  return { startIso: mid, endIso: mid };
}
