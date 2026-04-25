import "server-only";

import type { SourceSlice } from "../../widgets/source-breakdown";
import type { DashboardPeriod } from "../../shared/types";

const PERIOD_MULTIPLIER: Record<DashboardPeriod, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/**
 * MOCK — Sources d'acquisition de leads.
 * À brancher sur `lead_generation_imports.source` une fois plus de canaux ajoutés (PAP, SeLoger).
 */
export async function getAdminSources(period: DashboardPeriod): Promise<SourceSlice[]> {
  const m = PERIOD_MULTIPLIER[period];
  return [
    { key: "lbc", label: "Leboncoin", value: 35 * m, color: "#f97316" },
    { key: "pap", label: "PAP (à venir)", value: 0, color: "#94a3b8" },
    { key: "seloger", label: "SeLoger (à venir)", value: 0, color: "#94a3b8" },
    { key: "manual", label: "Saisie manuelle", value: 4 * m, color: "#0ea5e9" },
  ];
}
