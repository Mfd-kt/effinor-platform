/**
 * Types partagés pour les dashboards par rôle.
 *
 * Période d'analyse normalisée à travers tous les dashboards.
 * `today` = jour courant, `7d`/`30d`/`90d` = N derniers jours glissants.
 */
export type DashboardPeriod = "today" | "7d" | "30d" | "90d";

export const DASHBOARD_PERIODS: ReadonlyArray<DashboardPeriod> = ["today", "7d", "30d", "90d"];

export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: "Aujourd'hui",
  "7d": "7 jours",
  "30d": "30 jours",
  "90d": "90 jours",
};

export function parseDashboardPeriod(raw: string | string[] | undefined): DashboardPeriod {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && (DASHBOARD_PERIODS as ReadonlyArray<string>).includes(value)) {
    return value as DashboardPeriod;
  }
  return "30d";
}

/**
 * Comparaison entre la période courante et la précédente.
 * `direction` est dérivé du delta relatif (≥ +0.5 % → up, ≤ -0.5 % → down, sinon flat).
 */
export type TrendDirection = "up" | "down" | "flat";

export type Trend = {
  direction: TrendDirection;
  /** Variation relative en pourcentage (signée). null si la base de comparaison est nulle. */
  deltaPct: number | null;
};

export function computeTrend(current: number, previous: number): Trend {
  if (previous === 0) {
    if (current === 0) return { direction: "flat", deltaPct: 0 };
    return { direction: "up", deltaPct: null };
  }
  const deltaPct = ((current - previous) / Math.abs(previous)) * 100;
  if (deltaPct >= 0.5) return { direction: "up", deltaPct };
  if (deltaPct <= -0.5) return { direction: "down", deltaPct };
  return { direction: "flat", deltaPct };
}

/** Sévérité d'une alerte affichée en haut d'un dashboard. */
export type AlertSeverity = "info" | "warning" | "critical" | "success";

export type DashboardAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  description?: string;
  href?: string;
  ctaLabel?: string;
};
