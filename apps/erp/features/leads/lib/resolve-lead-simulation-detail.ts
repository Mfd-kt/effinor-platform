import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";
import { computeDestratEconomics } from "@/features/leads/simulator/domain/simulator";
import type { ClientType, DestratModel, HeatingMode } from "@/features/leads/simulator/domain/types";
import {
  extractWorkflowSimulationMetrics,
  resolveSimulationFieldSource,
} from "@/features/leads/study-pdf/domain/merge-workflow-simulation-into-lead-for-pdf";
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
  const normalized =
    o.normalizedInput && typeof o.normalizedInput === "object" && !Array.isArray(o.normalizedInput)
      ? (o.normalizedInput as Record<string, unknown>)
      : null;
  const inner =
    o.input && typeof o.input === "object" && !Array.isArray(o.input)
      ? (o.input as Record<string, unknown>)
      : o;
  let buildingHeated = toStr(o.buildingHeated) ?? toStr(inner.buildingHeated);
  if (!buildingHeated && typeof normalized?.isHeated === "boolean") {
    buildingHeated = normalized.isHeated ? "yes" : "no";
  }
  let consigne = toStr(inner.consigne) ?? toStr(normalized?.consigne);
  if (!consigne) {
    const sp = toNum(normalized?.setpointTemp);
    if (sp != null) consigne = `Consigne ${sp} °C`;
  }
  return {
    buildingHeated,
    clientType: toStr(inner.clientType) ?? toStr(normalized?.clientType),
    heightM: toNum(inner.heightM) ?? toNum(normalized?.heightM),
    surfaceM2: toNum(inner.surfaceM2) ?? toNum(normalized?.surfaceM2),
    heatingMode: toStr(inner.heatingMode) ?? toStr(normalized?.heatingMode),
    model: toStr(inner.model) ?? toStr(normalized?.model),
    consigne,
  };
}

type SimulationMetricsFields = Omit<
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
>;

function extractFlatMetricsFields(metrics: Record<string, unknown>): SimulationMetricsFields | null {
  if (Object.keys(metrics).length === 0) {
    return null;
  }
  return {
    volumeM3: toNum(metrics.volumeM3),
    airChangeRate: toNum(metrics.airChangeRate),
    modelCapacityM3h: toNum(metrics.modelCapacityM3h),
    neededDestrat: toNum(metrics.neededDestrat),
    powerKw: toNum(metrics.powerKw),
    consumptionKwhYear: toNum(metrics.consumptionKwhYear),
    costYearMin: toNum(metrics.costYearMin),
    costYearMax: toNum(metrics.costYearMax),
    costYearSelected: toNum(metrics.costYearSelected),
    savingKwh30: toNum(metrics.savingKwh30),
    savingEur30Min: toNum(metrics.savingEur30Min),
    savingEur30Max: toNum(metrics.savingEur30Max),
    savingEur30Selected: toNum(metrics.savingEur30Selected),
    co2SavedTons: toNum(metrics.co2SavedTons),
    ceePrimeEstimated: toNum(metrics.ceePrimeEstimated),
    installUnitPrice: toNum(metrics.installUnitPrice),
    installTotalPrice: toNum(metrics.installTotalPrice),
    restToCharge: toNum(metrics.restToCharge),
    leadScore: toNum(metrics.leadScore),
  };
}

/** PAC : le moteur met les champs déstrat à zéro et place les estimations dans `pacSavings`. */
function mergePacIntoMetricsFields(
  fields: SimulationMetricsFields,
  metrics: Record<string, unknown>,
): SimulationMetricsFields {
  const cee = metrics.ceeSolution;
  if (typeof cee !== "object" || cee === null || Array.isArray(cee)) {
    return fields;
  }
  if ((cee as { solution?: string }).solution !== "PAC") {
    return fields;
  }
  const pac = metrics.pacSavings;
  if (typeof pac !== "object" || pac === null || Array.isArray(pac)) {
    return fields;
  }
  const p = pac as Record<string, unknown>;
  const saveKwh = toNum(p.annualEnergySavingsKwh);
  const saveEur = toNum(p.annualCostSavings);
  const currentKwh = toNum(p.currentConsumptionKwh);
  return {
    ...fields,
    consumptionKwhYear: currentKwh ?? fields.consumptionKwhYear,
    savingKwh30: saveKwh ?? fields.savingKwh30,
    savingEur30Min: saveEur ?? fields.savingEur30Min,
    savingEur30Max: saveEur ?? fields.savingEur30Max,
    savingEur30Selected: saveEur ?? fields.savingEur30Selected,
  };
}

function applyMetricsOverlay(base: LeadSimulationDetail, overlay: SimulationMetricsFields): LeadSimulationDetail {
  const pick = (db: number | null, ov: number | null) => {
    if (ov == null || !Number.isFinite(ov)) return db;
    if (db == null || !Number.isFinite(db) || db === 0) return ov;
    return db;
  };
  const pickMoney = (db: number | null, ov: number | null) => {
    if (ov == null || !Number.isFinite(ov)) return db;
    if (db == null || !Number.isFinite(db)) return ov;
    return db;
  };
  return {
    ...base,
    volumeM3: pick(base.volumeM3, overlay.volumeM3),
    airChangeRate: pick(base.airChangeRate, overlay.airChangeRate),
    modelCapacityM3h: pick(base.modelCapacityM3h, overlay.modelCapacityM3h),
    neededDestrat: pick(base.neededDestrat, overlay.neededDestrat),
    powerKw: pick(base.powerKw, overlay.powerKw),
    consumptionKwhYear: pick(base.consumptionKwhYear, overlay.consumptionKwhYear),
    costYearMin: pickMoney(base.costYearMin, overlay.costYearMin),
    costYearMax: pickMoney(base.costYearMax, overlay.costYearMax),
    costYearSelected: pickMoney(base.costYearSelected, overlay.costYearSelected),
    savingKwh30: pick(base.savingKwh30, overlay.savingKwh30),
    savingEur30Min: pickMoney(base.savingEur30Min, overlay.savingEur30Min),
    savingEur30Max: pickMoney(base.savingEur30Max, overlay.savingEur30Max),
    savingEur30Selected: pickMoney(base.savingEur30Selected, overlay.savingEur30Selected),
    co2SavedTons: pick(base.co2SavedTons, overlay.co2SavedTons),
    ceePrimeEstimated: pickMoney(base.ceePrimeEstimated, overlay.ceePrimeEstimated),
    installUnitPrice: pickMoney(base.installUnitPrice, overlay.installUnitPrice),
    installTotalPrice: pickMoney(base.installTotalPrice, overlay.installTotalPrice),
    restToCharge: pickMoney(base.restToCharge, overlay.restToCharge),
    leadScore: pick(base.leadScore, overlay.leadScore),
  };
}

function mergeSimulationDetailWithFallback(
  primary: LeadSimulationDetail,
  fallback: LeadSimulationDetail,
): LeadSimulationDetail {
  const pn = (a: number | null, b: number | null) => {
    if (a != null && Number.isFinite(a) && a !== 0) return a;
    if (b != null && Number.isFinite(b)) return b;
    return a ?? b ?? null;
  };
  const pnz = (a: number | null, b: number | null) => {
    if (a != null && Number.isFinite(a)) return a;
    if (b != null && Number.isFinite(b)) return b;
    return null;
  };
  const ps = (a: string | null, b: string | null) => (a?.trim() ? a : b?.trim() ? b : a);

  return {
    source: primary.source,
    workflowLabel: primary.workflowLabel ?? fallback.workflowLabel,
    simulatedAt: primary.simulatedAt ?? fallback.simulatedAt,
    version: ps(primary.version, fallback.version),
    hasPayloadJson: primary.hasPayloadJson || fallback.hasPayloadJson,
    buildingHeated: ps(primary.buildingHeated, fallback.buildingHeated),
    clientType: ps(primary.clientType, fallback.clientType),
    heightM: pnz(primary.heightM, fallback.heightM),
    surfaceM2: pnz(primary.surfaceM2, fallback.surfaceM2),
    heatingMode: ps(primary.heatingMode, fallback.heatingMode),
    model: ps(primary.model, fallback.model),
    consigne: ps(primary.consigne, fallback.consigne),
    volumeM3: pn(primary.volumeM3, fallback.volumeM3),
    airChangeRate: pn(primary.airChangeRate, fallback.airChangeRate),
    modelCapacityM3h: pn(primary.modelCapacityM3h, fallback.modelCapacityM3h),
    neededDestrat: pn(primary.neededDestrat, fallback.neededDestrat),
    powerKw: pn(primary.powerKw, fallback.powerKw),
    consumptionKwhYear: pn(primary.consumptionKwhYear, fallback.consumptionKwhYear),
    costYearMin: pnz(primary.costYearMin, fallback.costYearMin),
    costYearMax: pnz(primary.costYearMax, fallback.costYearMax),
    costYearSelected: pnz(primary.costYearSelected, fallback.costYearSelected),
    savingKwh30: pn(primary.savingKwh30, fallback.savingKwh30),
    savingEur30Min: pnz(primary.savingEur30Min, fallback.savingEur30Min),
    savingEur30Max: pnz(primary.savingEur30Max, fallback.savingEur30Max),
    savingEur30Selected: pnz(primary.savingEur30Selected, fallback.savingEur30Selected),
    co2SavedTons: pn(primary.co2SavedTons, fallback.co2SavedTons),
    ceePrimeEstimated: pnz(primary.ceePrimeEstimated, fallback.ceePrimeEstimated),
    installUnitPrice: pnz(primary.installUnitPrice, fallback.installUnitPrice),
    installTotalPrice: pnz(primary.installTotalPrice, fallback.installTotalPrice),
    restToCharge: pnz(primary.restToCharge, fallback.restToCharge),
    leadScore: pn(primary.leadScore, fallback.leadScore),
  };
}

function isDestratModelId(s: string | null | undefined): s is DestratModel {
  return s === "teddington_ds3" || s === "teddington_ds7" || s === "generfeu";
}

function isClientTypeId(s: string | null | undefined): s is ClientType {
  return s === "Site industriel / logistique" || s === "Collectivité" || s === "Tertiaire";
}

function isHeatingModeId(s: string | null | undefined): s is HeatingMode {
  return s === "bois" || s === "gaz" || s === "fioul" || s === "elec" || s === "pac";
}

function readCeeSolutionKind(lead: LeadRow, wf: WorkflowScopedListRow | null): string | null {
  for (const raw of [lead.sim_payload_json, wf?.simulation_result_json]) {
    const m = extractWorkflowSimulationMetrics(raw);
    if (!m) continue;
    const cee = m.ceeSolution;
    if (typeof cee === "object" && cee !== null && !Array.isArray(cee)) {
      const s = (cee as { solution?: string }).solution;
      if (typeof s === "string") return s;
    }
  }
  return null;
}

function reconcileDestratDetailIfDegenerate(detail: LeadSimulationDetail): LeadSimulationDetail {
  const vol = detail.volumeM3;
  const volBad = vol == null || vol === 0;
  const dimOk =
    detail.heightM != null &&
    detail.heightM > 0 &&
    detail.surfaceM2 != null &&
    detail.surfaceM2 > 0;
  if (!volBad || !dimOk) return detail;
  if (!isClientTypeId(detail.clientType) || !isDestratModelId(detail.model) || !isHeatingModeId(detail.heatingMode)) {
    return detail;
  }
  const heightM = detail.heightM;
  const surfaceM2 = detail.surfaceM2;
  if (heightM == null || surfaceM2 == null) {
    return detail;
  }
  const econ = computeDestratEconomics({
    clientType: detail.clientType,
    heightM,
    surfaceM2,
    heatingMode: detail.heatingMode,
    model: detail.model,
    consigne: detail.consigne,
  });
  return {
    ...detail,
    volumeM3: econ.volumeM3,
    airChangeRate: econ.airChangeRate,
    modelCapacityM3h: econ.modelCapacityM3h,
    neededDestrat: econ.neededDestrat,
    powerKw: econ.powerKw,
    consumptionKwhYear: econ.consumptionKwhYear,
    costYearMin: econ.costYearMin,
    costYearMax: econ.costYearMax,
    costYearSelected: econ.costYearSelected,
    savingKwh30: econ.savingKwh30,
    savingEur30Min: econ.savingEur30Min,
    savingEur30Max: econ.savingEur30Max,
    savingEur30Selected: econ.savingEur30Selected,
    co2SavedTons: econ.co2SavedTons,
    ceePrimeEstimated: econ.ceePrimeEstimated,
    installUnitPrice: econ.installUnitPrice,
    installTotalPrice: econ.installTotalPrice,
    restToCharge: econ.restToCharge,
    leadScore: econ.leadScore,
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
  const fromPayload = extractInputFields(lead.sim_payload_json);
  const base: LeadSimulationDetail = {
    source: "lead",
    workflowLabel: null,
    simulatedAt: lead.simulated_at,
    version: lead.sim_version,
    hasPayloadJson: lead.sim_payload_json != null,
    buildingHeated: fromPayload.buildingHeated,
    clientType: lead.sim_client_type ?? fromPayload.clientType,
    heightM: lead.sim_height_m ?? fromPayload.heightM,
    surfaceM2: lead.sim_surface_m2 ?? fromPayload.surfaceM2,
    heatingMode: lead.sim_heating_mode ?? fromPayload.heatingMode,
    model: lead.sim_model ?? fromPayload.model,
    consigne: lead.sim_consigne ?? fromPayload.consigne,
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

  const resolved = resolveSimulationFieldSource(lead.sim_payload_json);
  if (!resolved) {
    return base;
  }

  const inputFromMetrics = extractInputFields(resolved.metrics);
  let merged: LeadSimulationDetail = {
    ...base,
    buildingHeated: base.buildingHeated ?? inputFromMetrics.buildingHeated,
    clientType: base.clientType ?? inputFromMetrics.clientType,
    heightM: base.heightM ?? inputFromMetrics.heightM,
    surfaceM2: base.surfaceM2 ?? inputFromMetrics.surfaceM2,
    heatingMode: base.heatingMode ?? inputFromMetrics.heatingMode,
    model: base.model ?? inputFromMetrics.model,
    consigne: base.consigne ?? inputFromMetrics.consigne,
  };

  const flat = extractFlatMetricsFields(resolved.metrics);
  if (flat) {
    const mergedM = mergePacIntoMetricsFields(flat, resolved.metrics);
    merged = applyMetricsOverlay(merged, mergedM);
  }

  merged.version = merged.version?.trim() ? merged.version : resolved.version ?? merged.version;
  merged.simulatedAt = merged.simulatedAt ?? resolved.simulatedAtIso ?? merged.simulatedAt;
  merged.hasPayloadJson = merged.hasPayloadJson || lead.sim_payload_json != null;

  return merged;
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
  const resolved = resolveSimulationFieldSource(wf.simulation_result_json);
  if (!resolved) {
    return null;
  }
  const flat = extractFlatMetricsFields(resolved.metrics);
  if (!flat) {
    return null;
  }
  const resultParsed = mergePacIntoMetricsFields(flat, resolved.metrics);

  const inputFromPayload = extractInputFields(wf.simulation_input_json);
  const inputFromResult = extractInputFields(wf.simulation_result_json);
  const inputFromResolvedMetrics = extractInputFields(resolved.metrics);

  const sheet = wf.cee_sheet;
  const workflowLabel = sheet ? `${sheet.code} — ${sheet.label}` : null;

  return {
    source: "workflow",
    workflowLabel,
    simulatedAt: resolved.simulatedAtIso ?? wf.updated_at ?? null,
    version: resolved.version,
    hasPayloadJson: wf.simulation_input_json != null && typeof wf.simulation_input_json === "object",
    buildingHeated: inputFromPayload.buildingHeated,
    clientType:
      inputFromPayload.clientType ?? inputFromResult.clientType ?? inputFromResolvedMetrics.clientType,
    heightM: inputFromPayload.heightM ?? inputFromResult.heightM ?? inputFromResolvedMetrics.heightM,
    surfaceM2: inputFromPayload.surfaceM2 ?? inputFromResult.surfaceM2 ?? inputFromResolvedMetrics.surfaceM2,
    heatingMode:
      inputFromPayload.heatingMode ?? inputFromResult.heatingMode ?? inputFromResolvedMetrics.heatingMode,
    model: inputFromPayload.model ?? inputFromResult.model ?? inputFromResolvedMetrics.model,
    consigne: inputFromPayload.consigne ?? inputFromResult.consigne ?? inputFromResolvedMetrics.consigne,
    ...resultParsed,
  };
}

/**
 * Détail affichable pour la fiche lead : colonnes `leads.sim_*` + `sim_payload_json`,
 * fusionné avec la simulation du workflow CEE courant lorsque les colonnes sont incomplètes.
 */
export function resolveLeadSimulationDetail(
  lead: LeadRow,
  workflows: WorkflowScopedListRow[],
): LeadSimulationDetail | null {
  let detail: LeadSimulationDetail | null = leadHasLegacySimulationColumns(lead) ? detailFromLead(lead) : null;

  const wf = pickWorkflowForSimulation(lead, workflows);
  const wfDetail = wf ? detailFromWorkflow(wf) : null;

  if (!detail && wfDetail) {
    detail = wfDetail;
  } else if (detail && wfDetail) {
    detail = mergeSimulationDetailWithFallback(detail, wfDetail);
  }

  if (!detail) {
    return null;
  }

  const ceeKind = readCeeSolutionKind(lead, wf);
  if (ceeKind !== "PAC" && ceeKind !== "NONE") {
    detail = reconcileDestratDetailIfDegenerate(detail);
  }

  return detail;
}
