import "server-only";

import type { TimelinePoint, TimelineSeries } from "../../widgets/timeline-chart";
import type { DashboardPeriod } from "../../shared/types";

const PERIOD_BUCKETS: Record<DashboardPeriod, number> = {
  today: 24,
  "7d": 7,
  "30d": 30,
  "90d": 12,
};

const PERIOD_LABEL_MODE: Record<DashboardPeriod, "hour" | "day" | "week"> = {
  today: "hour",
  "7d": "day",
  "30d": "day",
  "90d": "week",
};

export type AdminTimeline = {
  points: TimelinePoint[];
  series: TimelineSeries[];
};

/** Pseudo-aléatoire stable basé sur l'index — évite l'hydratation incohérente. */
function deterministic(seed: number, base: number, amplitude: number): number {
  const noise = Math.sin(seed * 12.9898) * 43758.5453;
  const fraction = noise - Math.floor(noise);
  return Math.max(0, Math.round(base + (fraction - 0.5) * amplitude * 2));
}

/**
 * MOCK — Évolution temporelle leads / accords / signés sur la période.
 * Buckets adaptés à la période (heures aujourd'hui, jours sur 7d/30d, semaines sur 90d).
 */
export async function getAdminTimeline(period: DashboardPeriod): Promise<AdminTimeline> {
  const buckets = PERIOD_BUCKETS[period];
  const labelMode = PERIOD_LABEL_MODE[period];

  const points: TimelinePoint[] = Array.from({ length: buckets }, (_, i) => {
    const labelIndex = i + 1;
    const date =
      labelMode === "hour"
        ? `${String(i).padStart(2, "0")}h`
        : labelMode === "week"
          ? `S${labelIndex}`
          : `J${labelIndex}`;
    return {
      date,
      leads: deterministic(i * 3 + 1, 18, 12),
      agreements: deterministic(i * 3 + 2, 6, 5),
      signed: deterministic(i * 3 + 3, 3, 3),
    };
  });

  return {
    points,
    series: [
      { key: "leads", label: "Leads créés", color: "#0ea5e9" },
      { key: "agreements", label: "Accords", color: "#10b981" },
      { key: "signed", label: "Signés", color: "#8b5cf6" },
    ],
  };
}
