import "server-only";

import type { FunnelStep } from "../../widgets/funnel-chart";
import type { DashboardPeriod } from "../../shared/types";

const PERIOD_MULTIPLIER: Record<DashboardPeriod, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/**
 * MOCK — Funnel global Stock → Qualifiés → RDV → Accords → VT → Install → Primes.
 * À brancher sur un agrégat des tables `lead_generation_*`, `appointments`, `agreements`,
 * `technical_visits`, `installations`, `cee_*` filtré par fenêtre temporelle.
 */
export async function getAdminFunnel(period: DashboardPeriod): Promise<FunnelStep[]> {
  const m = PERIOD_MULTIPLIER[period];
  const stock = 1200 * Math.max(1, Math.min(m, 30));
  const qualified = Math.round(stock * 0.42);
  const appointments = Math.round(qualified * 0.55);
  const agreements = Math.round(appointments * 0.46);
  const vt = Math.round(agreements * 0.72);
  const installs = Math.round(vt * 0.81);
  const primes = Math.round(installs * 0.78);

  return [
    { key: "stock", label: "Stock", value: stock },
    { key: "qualified", label: "Qualifiés", value: qualified },
    { key: "appointments", label: "RDV", value: appointments },
    { key: "agreements", label: "Accords", value: agreements },
    { key: "vt", label: "VT", value: vt },
    { key: "installs", label: "Installations", value: installs },
    { key: "primes", label: "Primes", value: primes },
  ];
}
