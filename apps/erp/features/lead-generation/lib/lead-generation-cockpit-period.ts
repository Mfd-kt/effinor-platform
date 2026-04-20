import type { LeadGenerationCockpitPeriod } from "../domain/lead-generation-cockpit";

export function cockpitPeriodHours(period: LeadGenerationCockpitPeriod): number {
  if (period === "24h") return 24;
  if (period === "7d") return 24 * 7;
  return 24 * 30;
}

/** Début de la fenêtre d’analyse (glissante) pour la période cockpit. */
export function cockpitPeriodStartIso(period: LeadGenerationCockpitPeriod, now: Date = new Date()): string {
  const d = new Date(now.getTime());
  d.setTime(d.getTime() - cockpitPeriodHours(period) * 3600000);
  return d.toISOString();
}

/** Début de la fenêtre précédente (même durée), pour deltas. */
export function cockpitPreviousPeriodStartIso(period: LeadGenerationCockpitPeriod, now: Date = new Date()): string {
  const d = new Date(now.getTime());
  d.setTime(d.getTime() - 2 * cockpitPeriodHours(period) * 3600000);
  return d.toISOString();
}

export function isoHoursAgo(hours: number, now: Date = new Date()): string {
  return new Date(now.getTime() - hours * 3600000).toISOString();
}
