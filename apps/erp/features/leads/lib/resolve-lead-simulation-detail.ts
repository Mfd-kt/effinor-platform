// TODO: cee-workflows / simulator retiré — la résolution du détail simulation lead/workflow
// est désactivée en attendant le nouveau pipeline simulation.

import type { LeadRow } from "@/features/leads/types";

export type LeadSimulationDetail = {
  source: "lead" | "workflow";
  workflowLabel: string | null;
  simulatedAt: string | null;
  version: string | null;
  hasPayloadJson: boolean;
  buildingHeated: string | null;
  clientType: string | null;
  heightM: number | null;
  surfaceM2: number | null;
  heatingMode: string | null;
  model: string | null;
  consigne: string | null;
  volumeM3: number | null;
  airChangeRate: number | null;
  modelCapacityM3h: number | null;
  neededDestrat: number | null;
  powerKw: number | null;
  consumptionKwhYear: number | null;
  costYearMin: number | null;
  costYearMax: number | null;
  costYearSelected: number | null;
  savingKwh30: number | null;
  savingEur30Min: number | null;
  savingEur30Max: number | null;
  savingEur30Selected: number | null;
  co2SavedTons: number | null;
  ceePrimeEstimated: number | null;
  installUnitPrice: number | null;
  installTotalPrice: number | null;
  restToCharge: number | null;
  leadScore: number | null;
};

export function resolveLeadSimulationDetail(
  _lead: LeadRow,
  _workflows: any[],
): LeadSimulationDetail | null {
  return null;
}
