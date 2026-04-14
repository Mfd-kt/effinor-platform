import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";
import type { LeadRow } from "@/features/leads/types";
import type { Json } from "@/types/database.types";

/** Données normalisées pour l’affichage « Simulateur commercial » (lead ou workflow). */
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

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(String(v).trim().replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toStr(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function isNonEmptyResultJson(json: Json | null): boolean {
  if (json == null) return false;
  if (typeof json !== "object" || Array.isArray(json)) return false;
  return Object.keys(json as object).length > 0;
}

function extractInputFields(payload: unknown): {
  buildingHeated: string | null;
  clientType: string | null;
  heightM: number | null;
  surfaceM2: number | null;
  heatingMode: string | null;
  model: string | null;
  consigne: string | null;
} {
  const empty = {
    buildingHeated: null as string | null,
    clientType: null as string | null,
    heightM: null as number | null,
    surfaceM2: null as number | null,
    heatingMode: null as string | null,
    model: null as string | null,
    consigne: null as string | null,
  };
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return empty;
  }
  const o = payload as Record<string, unknown>;
  const inner =
    o.input && typeof o.input === "object" && !Array.isArray(o.input)
      ? (o.input as Record<string, unknown>)
      : o;
  const bh = toStr(o.buildingHeated) ?? toStr(inner.buildingHeated);
  return {
    buildingHeated: bh,
    clientType: toStr(inner.clientType),
    heightM: toNum(inner.heightM),
    surfaceM2: toNum(inner.surfaceM2),
    heatingMode: toStr(inner.heatingMode),
    model: toStr(inner.model),
    consigne: toStr(inner.consigne),
  };
}

function extractResultFields(payload: unknown): Omit<
  LeadSimulationDetail,
  | "source"
  | "workflowLabel"
  | "simulatedAt"
  | "version"
  | "hasPayloadJson"
  | "buildingHeated"
  | "clientType"
  | "heightM"
  | "surfaceM2"
  | "heatingMode"
  | "model"
  | "consigne"
> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const r = payload as Record<string, unknown>;
  if (Object.keys(r).length === 0) {
    return null;
  }
  return {
    volumeM3: toNum(r.volumeM3),
    airChangeRate: toNum(r.airChangeRate),
    modelCapacityM3h: toNum(r.modelCapacityM3h),
    neededDestrat: toNum(r.neededDestrat),
    powerKw: toNum(r.powerKw),
    consumptionKwhYear: toNum(r.consumptionKwhYear),
    costYearMin: toNum(r.costYearMin),
    costYearMax: toNum(r.costYearMax),
    costYearSelected: toNum(r.costYearSelected),
    savingKwh30: toNum(r.savingKwh30),
    savingEur30Min: toNum(r.savingEur30Min),
    savingEur30Max: toNum(r.savingEur30Max),
    savingEur30Selected: toNum(r.savingEur30Selected),
    co2SavedTons: toNum(r.co2SavedTons),
    ceePrimeEstimated: toNum(r.ceePrimeEstimated),
    installUnitPrice: toNum(r.installUnitPrice),
    installTotalPrice: toNum(r.installTotalPrice),
    restToCharge: toNum(r.restToCharge),
    leadScore: toNum(r.leadScore),
  };
}

function leadHasLegacySimulationColumns(lead: LeadRow): boolean {
  return (
    lead.simulated_at !== null ||
    lead.sim_payload_json !== null ||
    lead.sim_height_m !== null ||
    lead.sim_surface_m2 !== null
  );
}

function detailFromLead(lead: LeadRow): LeadSimulationDetail {
  return {
    source: "lead",
    workflowLabel: null,
    simulatedAt: lead.simulated_at,
    version: lead.sim_version,
    hasPayloadJson: lead.sim_payload_json != null,
    buildingHeated: null,
    clientType: lead.sim_client_type,
    heightM: lead.sim_height_m,
    surfaceM2: lead.sim_surface_m2,
    heatingMode: lead.sim_heating_mode,
    model: lead.sim_model,
    consigne: lead.sim_consigne,
    volumeM3: lead.sim_volume_m3,
    airChangeRate: lead.sim_air_change_rate,
    modelCapacityM3h: lead.sim_model_capacity_m3h,
    neededDestrat: lead.sim_needed_destrat,
    powerKw: lead.sim_power_kw,
    consumptionKwhYear: lead.sim_consumption_kwh_year,
    costYearMin: lead.sim_cost_year_min,
    costYearMax: lead.sim_cost_year_max,
    costYearSelected: lead.sim_cost_year_selected,
    savingKwh30: lead.sim_saving_kwh_30,
    savingEur30Min: lead.sim_saving_eur_30_min,
    savingEur30Max: lead.sim_saving_eur_30_max,
    savingEur30Selected: lead.sim_saving_eur_30_selected,
    co2SavedTons: lead.sim_co2_saved_tons,
    ceePrimeEstimated: lead.sim_cee_prime_estimated,
    installUnitPrice: lead.sim_install_unit_price,
    installTotalPrice: lead.sim_install_total_price,
    restToCharge: lead.sim_rest_to_charge,
    leadScore: lead.sim_lead_score,
  };
}

function pickWorkflowForSimulation(lead: LeadRow, workflows: WorkflowScopedListRow[]): WorkflowScopedListRow | null {
  if (!workflows.length) return null;
  const currentId = lead.current_workflow_id;
  if (currentId) {
    const match = workflows.find((w) => w.id === currentId);
    if (match && isNonEmptyResultJson(match.simulation_result_json)) {
      return match;
    }
  }
  return workflows.find((w) => isNonEmptyResultJson(w.simulation_result_json)) ?? null;
}

function detailFromWorkflow(wf: WorkflowScopedListRow): LeadSimulationDetail | null {
  const resultParsed = extractResultFields(wf.simulation_result_json);
  if (!resultParsed) {
    return null;
  }
  const inputFromPayload = extractInputFields(wf.simulation_input_json);
  const inputFromResult = extractInputFields(wf.simulation_result_json);

  const sheet = wf.cee_sheet;
  const workflowLabel = sheet ? `${sheet.code} — ${sheet.label}` : null;

  return {
    source: "workflow",
    workflowLabel,
    simulatedAt: wf.updated_at ?? null,
    version: null,
    hasPayloadJson: wf.simulation_input_json != null && typeof wf.simulation_input_json === "object",
    buildingHeated: inputFromPayload.buildingHeated,
    clientType: inputFromPayload.clientType ?? inputFromResult.clientType,
    heightM: inputFromPayload.heightM ?? inputFromResult.heightM,
    surfaceM2: inputFromPayload.surfaceM2 ?? inputFromResult.surfaceM2,
    heatingMode: inputFromPayload.heatingMode ?? inputFromResult.heatingMode,
    model: inputFromPayload.model ?? inputFromResult.model,
    consigne: inputFromPayload.consigne ?? inputFromResult.consigne,
    ...resultParsed,
  };
}

/**
 * Détail affichable pour la fiche lead : colonnes `leads.sim_*` si présentes,
 * sinon simulation du workflow CEE courant / le plus récent avec résultat.
 */
export function resolveLeadSimulationDetail(
  lead: LeadRow,
  workflows: WorkflowScopedListRow[],
): LeadSimulationDetail | null {
  if (leadHasLegacySimulationColumns(lead)) {
    return detailFromLead(lead);
  }
  const wf = pickWorkflowForSimulation(lead, workflows);
  if (!wf) {
    return null;
  }
  return detailFromWorkflow(wf);
}
