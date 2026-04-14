import type { CockpitTrend } from "@/features/dashboard/domain/cockpit";

import { computeTrend } from "./cockpit-aggregates";

export { computeTrend };

/** Texte court pour cartes (delta % vs période précédente). */
export function computeDeltaLabel(trend: CockpitTrend): string {
  if (trend.deltaPct == null) return "—";
  if (trend.previous === 0 && trend.current === 0) return "Stable";
  const sign = trend.deltaPct > 0 ? "+" : "";
  return `${sign}${trend.deltaPct} % vs période préc.`;
}

export function trendFromCounts(current: number, previous: number): CockpitTrend {
  return computeTrend(current, previous);
}
