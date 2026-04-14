import type { LeadDetailRow } from "@/features/leads/types";

import type { StudyCeeSolutionKind } from "./types";

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

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

/** Priorité : `normalizedInput` puis `input` (snapshot simulateur / poste agent). */
function buildInputFallback(
  normalizedInput: Record<string, unknown> | null,
  rawSimulatorInput: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!normalizedInput && !rawSimulatorInput) return null;
  return { ...(rawSimulatorInput ?? {}), ...(normalizedInput ?? {}) };
}

function patchNum<K extends keyof LeadDetailRow>(
  lead: LeadDetailRow,
  patch: Partial<LeadDetailRow>,
  key: K,
  jsonVal: unknown,
  opts?: { treatCurrentZeroAsEmpty?: boolean },
) {
  const v = toNum(jsonVal);
  if (v == null) return;
  const cur = lead[key];
  if (cur !== null && cur !== undefined) {
    if (!(opts?.treatCurrentZeroAsEmpty && typeof cur === "number" && cur === 0)) {
      return;
    }
  }
  (patch as Record<string, number>)[key as string] = v;
}

/**
 * À plat : `SimulatorComputedResult` enregistré par l’agent.
 * Snapshot : `{ result, normalizedInput?, simulatedAtIso?, version? }` (cf. `LeadSimulationSnapshot`).
 */
export function resolveSimulationFieldSource(simulationResultJson: unknown): {
  metrics: Record<string, unknown>;
  inputFallback: Record<string, unknown> | null;
  simulatedAtIso: string | null;
  version: string | null;
} | null {
  if (!simulationResultJson || typeof simulationResultJson !== "object" || Array.isArray(simulationResultJson)) {
    return null;
  }
  const root = simulationResultJson as Record<string, unknown>;
  const nestedResult = root.result;
  if (nestedResult && typeof nestedResult === "object" && !Array.isArray(nestedResult)) {
    const metrics = nestedResult as Record<string, unknown>;
    const inputFallback = buildInputFallback(asRecord(root.normalizedInput), asRecord(root.input));
    return {
      metrics,
      inputFallback,
      simulatedAtIso: toStr(root.simulatedAtIso),
      version: toStr(root.version),
    };
  }
  return {
    metrics: root,
    inputFallback: asRecord(root.input),
    simulatedAtIso: toStr(root.simulatedAtIso),
    version: toStr(root.version),
  };
}

export function extractWorkflowSimulationMetrics(simulationJson: unknown): Record<string, unknown> | null {
  const resolved = resolveSimulationFieldSource(simulationJson);
  return resolved?.metrics ?? null;
}

/** Détection du type de solution uniquement depuis les JSON de simulation (sans fiche CEE). */
export function readStudyCeeSolutionKindFromSimulation(input: {
  lead: LeadDetailRow;
  mergedSimulationJson?: unknown;
}): StudyCeeSolutionKind {
  const ordered = [input.mergedSimulationJson, input.lead.sim_payload_json];
  for (const raw of ordered) {
    const m = extractWorkflowSimulationMetrics(raw);
    if (!m) continue;
    const cee = asRecord(m.ceeSolution);
    const s = typeof cee?.solution === "string" ? cee.solution : null;
    if (s === "PAC") return "pac";
    if (s === "DESTRAT") return "destrat";
    if (s === "NONE") return "none";
  }
  return "destrat";
}

/** @deprecated Préférer `resolveStudyTemplatesFromCeeSheet` côté génération PDF. */
export function readStudyCeeSolutionKindFromInputs(input: {
  lead: LeadDetailRow;
  mergedSimulationJson?: unknown;
}): StudyCeeSolutionKind {
  return readStudyCeeSolutionKindFromSimulation(input);
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Lorsque le simulateur retient une PAC, les champs `sim_*` déstrat sont à zéro mais `pacSavings` contient les économies.
 * On recopie vers les mêmes clés que le PDF attend, et on force investissement / reste à charge à 0 € (devis à confirmer).
 */
function applyPacStudyMetricsPatch(
  lead: LeadDetailRow,
  r: Record<string, unknown>,
  patch: Partial<LeadDetailRow>,
): void {
  const cee = asRecord(r.ceeSolution);
  const solution = typeof cee?.solution === "string" ? cee.solution : null;
  if (solution !== "PAC") return;

  const pac = asRecord(r.pacSavings);
  if (!pac) return;

  const saveEur = toNum(pac.annualCostSavings);
  const saveKwh = toNum(pac.annualEnergySavingsKwh);

  const leadSave = lead.sim_saving_eur_30_selected;
  const shouldFillSavings =
    saveEur != null && (leadSave == null || leadSave === 0 || (typeof leadSave === "number" && leadSave < 0.01));
  if (shouldFillSavings) {
    patch.sim_saving_eur_30_selected = Math.max(0, roundMoney(saveEur));
  }

  const leadKwh = lead.sim_saving_kwh_30;
  const shouldFillKwh =
    saveKwh != null && (leadKwh == null || leadKwh === 0 || (typeof leadKwh === "number" && leadKwh < 1));
  if (shouldFillKwh) {
    patch.sim_saving_kwh_30 = Math.max(0, Math.round(saveKwh));
  }

  patch.sim_install_total_price = 0;
  patch.sim_install_unit_price = 0;
  patch.sim_rest_to_charge = 0;
  patch.sim_cee_prime_estimated = 0;
  patch.sim_needed_destrat = 0;
}

/**
 * Enrichit un lead en mémoire avec les champs issus de `simulation_result_json` (workflow agent)
 * lorsque les colonnes `sim_*` / surface du lead sont encore vides — même logique que après `simulate-lead`.
 */
export function mergeLeadDetailWithWorkflowSimulationResult(
  lead: LeadDetailRow,
  simulationResultJson: unknown,
): LeadDetailRow {
  const resolved = resolveSimulationFieldSource(simulationResultJson);
  if (!resolved) {
    return lead;
  }
  const r = resolved.metrics;
  const input = resolved.inputFallback;
  const pick = (key: string) => r[key] ?? input?.[key];
  const patch: Partial<LeadDetailRow> = {};

  if (lead.simulated_at == null && resolved.simulatedAtIso) {
    patch.simulated_at = resolved.simulatedAtIso;
  }
  if (!lead.sim_version?.trim() && resolved.version) {
    patch.sim_version = resolved.version;
  }

  const surf = toNum(pick("surfaceM2"));
  if (lead.sim_surface_m2 == null && surf != null) {
    patch.sim_surface_m2 = surf;
  }

  const h = toNum(pick("heightM"));
  if (lead.sim_height_m == null && h != null) {
    patch.sim_height_m = h;
  }

  const hm = toStr(pick("heatingMode"));
  if (!lead.sim_heating_mode?.trim() && (!lead.heating_type || lead.heating_type.length === 0) && hm) {
    patch.sim_heating_mode = hm;
  }

  const model =
    toStr(pick("model")) ?? toStr(r["sim_model"]) ?? toStr(input?.["sim_model"]);
  if (!lead.sim_model?.trim() && model) {
    patch.sim_model = model;
  }

  const ct =
    toStr(pick("clientType")) ??
    toStr(r["sim_client_type"]) ??
    toStr(r["client_type"]) ??
    toStr(input?.["client_type"]);
  if (!lead.sim_client_type?.trim() && ct) {
    patch.sim_client_type = ct;
  }

  const cons = toStr(pick("consigne"));
  if (!lead.sim_consigne?.trim() && cons) {
    patch.sim_consigne = cons;
  }

  const zeroPatch = { treatCurrentZeroAsEmpty: true } as const;
  patchNum(lead, patch, "sim_volume_m3", r.volumeM3, zeroPatch);
  patchNum(lead, patch, "sim_air_change_rate", r.airChangeRate, zeroPatch);
  patchNum(lead, patch, "sim_model_capacity_m3h", r.modelCapacityM3h, zeroPatch);
  patchNum(lead, patch, "sim_needed_destrat", r.neededDestrat, zeroPatch);
  patchNum(lead, patch, "sim_power_kw", r.powerKw, zeroPatch);
  patchNum(lead, patch, "sim_consumption_kwh_year", r.consumptionKwhYear, zeroPatch);
  patchNum(lead, patch, "sim_cost_year_min", r.costYearMin, zeroPatch);
  patchNum(lead, patch, "sim_cost_year_max", r.costYearMax, zeroPatch);
  patchNum(lead, patch, "sim_cost_year_selected", r.costYearSelected, zeroPatch);
  patchNum(lead, patch, "sim_saving_kwh_30", r.savingKwh30, zeroPatch);
  patchNum(lead, patch, "sim_saving_eur_30_min", r.savingEur30Min, zeroPatch);
  patchNum(lead, patch, "sim_saving_eur_30_max", r.savingEur30Max, zeroPatch);
  patchNum(lead, patch, "sim_saving_eur_30_selected", r.savingEur30Selected, zeroPatch);
  patchNum(lead, patch, "sim_co2_saved_tons", r.co2SavedTons, zeroPatch);
  patchNum(lead, patch, "sim_cee_prime_estimated", r.ceePrimeEstimated, zeroPatch);
  patchNum(lead, patch, "sim_install_unit_price", r.installUnitPrice, zeroPatch);
  patchNum(lead, patch, "sim_install_total_price", r.installTotalPrice, zeroPatch);
  patchNum(lead, patch, "sim_rest_to_charge", r.restToCharge, zeroPatch);

  const score = toNum(r.leadScore);
  if (score != null && (lead.sim_lead_score == null || lead.sim_lead_score === 0)) {
    patch.sim_lead_score = Math.round(score);
  }

  applyPacStudyMetricsPatch(lead, r, patch);

  if (Object.keys(patch).length === 0) {
    return lead;
  }

  return { ...lead, ...patch };
}
