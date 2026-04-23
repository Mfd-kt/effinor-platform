import "server-only";

import type { DashboardPeriod, Trend } from "../../shared/types";
import { computeTrend } from "../../shared/types";

export type AdminOverviewKpi = {
  key: "leads_created" | "agreements_signed" | "vt_done" | "premiums_paid" | "conversion_rate";
  label: string;
  value: number;
  /** Représentation textuelle (formatée fr-FR) — utile pour primes en € ou taux en %. */
  display: string;
  trend: Trend;
  trendPolarity?: "higher-is-better" | "lower-is-better";
  sublabel?: string;
};

export type AdminOverviewKpis = {
  period: DashboardPeriod;
  generatedAt: string;
  kpis: AdminOverviewKpi[];
};

const PERIOD_MULTIPLIER: Record<DashboardPeriod, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/**
 * MOCK — KPIs cockpit Admin / Super_admin.
 * À remplacer par une agrégation Supabase (vue matérialisée `mv_admin_overview` ou queries directes).
 */
export async function getAdminOverviewKpis(period: DashboardPeriod): Promise<AdminOverviewKpis> {
  const m = PERIOD_MULTIPLIER[period];
  const leads = 42 * m;
  const agreements = Math.round(leads * 0.18);
  const vt = Math.round(agreements * 0.72);
  const primes = Math.round(vt * 0.55);
  const convRate = leads > 0 ? Math.round((primes / leads) * 100 * 10) / 10 : 0;

  const previous = {
    leads: Math.round(leads * 0.92),
    agreements: Math.round(agreements * 1.04),
    vt: Math.round(vt * 0.88),
    primes: Math.round(primes * 1.12),
    convRate: convRate * 0.95,
  };

  const eur = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return {
    period,
    generatedAt: new Date().toISOString(),
    kpis: [
      {
        key: "leads_created",
        label: "Leads créés",
        value: leads,
        display: leads.toLocaleString("fr-FR"),
        trend: computeTrend(leads, previous.leads),
        sublabel: "vs période précédente",
      },
      {
        key: "agreements_signed",
        label: "Accords signés",
        value: agreements,
        display: agreements.toLocaleString("fr-FR"),
        trend: computeTrend(agreements, previous.agreements),
        sublabel: "vs période précédente",
      },
      {
        key: "vt_done",
        label: "VT réalisées",
        value: vt,
        display: vt.toLocaleString("fr-FR"),
        trend: computeTrend(vt, previous.vt),
        sublabel: "vs période précédente",
      },
      {
        key: "premiums_paid",
        label: "Primes payées",
        value: primes,
        display: eur(primes * 1850),
        trend: computeTrend(primes, previous.primes),
        sublabel: `${primes.toLocaleString("fr-FR")} dossiers`,
      },
      {
        key: "conversion_rate",
        label: "Taux de conversion",
        value: convRate,
        display: `${convRate.toLocaleString("fr-FR")} %`,
        trend: computeTrend(convRate, previous.convRate),
        sublabel: "lead → prime",
      },
    ],
  };
}
