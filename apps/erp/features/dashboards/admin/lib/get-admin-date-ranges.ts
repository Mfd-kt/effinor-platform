import { getParisDayRangeIso } from "@/lib/datetime/paris-day";
import { getParisYesterdayRangeIso } from "@/lib/datetime/paris-week-month";

import type { DashboardPeriod } from "../../shared/types";

const MS_DAY = 86_400_000;

export type AdminIsoRange = {
  startIso: string;
  endIso: string;
};

/**
 * Période courante du cockpit super admin, alignée sur `shared/types` :
 * `7d` / `30d` / `90d` = fenêtres **glissantes** ; `today` = jour civil Paris → maintenant.
 */
export function getAdminCurrentRange(period: DashboardPeriod, now = new Date()): AdminIsoRange {
  if (period === "today") {
    const { startIso } = getParisDayRangeIso(now);
    return { startIso, endIso: now.toISOString() };
  }
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return {
    startIso: new Date(now.getTime() - days * MS_DAY).toISOString(),
    endIso: now.toISOString(),
  };
}

/** Fenêtre de même durée, immédiatement **avant** la fenêtre courante (sert aux tendances). */
export function getAdminPreviousRange(period: DashboardPeriod, now = new Date()): AdminIsoRange {
  if (period === "today") {
    const y = getParisYesterdayRangeIso(now);
    return { startIso: y.startIso, endIso: y.endIso };
  }
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const endMs = now.getTime() - days * MS_DAY;
  return {
    startIso: new Date(endMs - days * MS_DAY).toISOString(),
    endIso: new Date(endMs).toISOString(),
  };
}
