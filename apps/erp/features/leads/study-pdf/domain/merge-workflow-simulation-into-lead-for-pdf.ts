import type { LeadDetailRow } from "@/features/leads/types";

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
) {
  const v = toNum(jsonVal);
  if (v == null) return;
  const cur = lead[key];
  if (cur !== null && cur !== undefined) return;
  (patch as Record<string, number>)[key as string] = v;
}

/**
 * À plat : `SimulatorComputedResult` enregistré par l’agent.
 * Snapshot : `{ result, normalizedInput?, simulatedAtIso?, version? }` (cf. `LeadSimulationSnapshot`).
 */
function resolveSimulationFieldSource(simulationResultJson: unknown): {
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

  patchNum(lead, patch, "sim_volume_m3", r.volumeM3);
  patchNum(lead, patch, "sim_air_change_rate", r.airChangeRate);
  patchNum(lead, patch, "sim_model_capacity_m3h", r.modelCapacityM3h);
  patchNum(lead, patch, "sim_needed_destrat", r.neededDestrat);
  patchNum(lead, patch, "sim_power_kw", r.powerKw);
  patchNum(lead, patch, "sim_consumption_kwh_year", r.consumptionKwhYear);
  patchNum(lead, patch, "sim_cost_year_min", r.costYearMin);
  patchNum(lead, patch, "sim_cost_year_max", r.costYearMax);
  patchNum(lead, patch, "sim_cost_year_selected", r.costYearSelected);
  patchNum(lead, patch, "sim_saving_kwh_30", r.savingKwh30);
  patchNum(lead, patch, "sim_saving_eur_30_min", r.savingEur30Min);
  patchNum(lead, patch, "sim_saving_eur_30_max", r.savingEur30Max);
  patchNum(lead, patch, "sim_saving_eur_30_selected", r.savingEur30Selected);
  patchNum(lead, patch, "sim_co2_saved_tons", r.co2SavedTons);
  patchNum(lead, patch, "sim_cee_prime_estimated", r.ceePrimeEstimated);
  patchNum(lead, patch, "sim_install_unit_price", r.installUnitPrice);
  patchNum(lead, patch, "sim_install_total_price", r.installTotalPrice);
  patchNum(lead, patch, "sim_rest_to_charge", r.restToCharge);

  const score = toNum(r.leadScore);
  if (score != null && lead.sim_lead_score == null) {
    patch.sim_lead_score = Math.round(score);
  }

  if (Object.keys(patch).length === 0) {
    return lead;
  }

  return { ...lead, ...patch };
}
