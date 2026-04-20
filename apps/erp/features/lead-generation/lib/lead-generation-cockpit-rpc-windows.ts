import type { LeadGenerationCockpitPeriod } from "../domain/lead-generation-cockpit";
import {
  cockpitPeriodStartIso,
  cockpitPreviousPeriodStartIso,
} from "./lead-generation-cockpit-period";

/** Bornes explicites pour les RPC SQL (fin ouverte : [start, end)). */
export type LeadGenerationCockpitRpcWindows = {
  windowEnd: string;
  periodStart: string;
  prevPeriodStart: string;
};

export function getLeadGenerationCockpitRpcWindows(
  period: LeadGenerationCockpitPeriod,
  now: Date = new Date(),
): LeadGenerationCockpitRpcWindows {
  return {
    windowEnd: now.toISOString(),
    periodStart: cockpitPeriodStartIso(period, now),
    prevPeriodStart: cockpitPreviousPeriodStartIso(period, now),
  };
}
