import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";
import type { LeadFormInput } from "@/features/leads/schemas/lead.schema";
import {
  buildingTypeFromSimulatorClientType,
  heatingTypeFromSimulator,
} from "@/features/leads/lib/form-defaults";
import {
  leadBuildingTypeFromSimulatorCee,
  leadHeatingTypesFromSimulator,
  parseWorkflowSimulationSnapshotJson,
} from "@/features/leads/lib/simulator-to-lead-technical";
import { isPacPreferredLocalUsage } from "@/features/leads/simulator/domain/cee-solution-decision";

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(String(v).trim().replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function isWorkflowQualificationDataEmpty(raw: unknown): boolean {
  if (raw == null) return true;
  if (typeof raw !== "object" || Array.isArray(raw)) return true;
  return Object.keys(raw as object).length === 0;
}

function extractBuildingHeatedForForm(input: unknown): "" | "true" | "false" {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "";
  const o = input as Record<string, unknown>;
  const inner =
    o.input && typeof o.input === "object" && !Array.isArray(o.input)
      ? (o.input as Record<string, unknown>)
      : o;
  const norm =
    o.normalizedInput && typeof o.normalizedInput === "object" && !Array.isArray(o.normalizedInput)
      ? (o.normalizedInput as Record<string, unknown>)
      : null;
  const raw = inner.buildingHeated ?? inner.isHeated ?? norm?.isHeated ?? o.buildingHeated ?? o.isHeated;
  if (raw === "yes" || raw === true) return "true";
  if (raw === "no" || raw === false) return "false";
  return "";
}

export function simulationResultHasData(json: unknown): boolean {
  if (json == null) return false;
  if (typeof json !== "object" || Array.isArray(json)) return false;
  return Object.keys(json as object).length > 0;
}

/**
 * Complète les champs encore vides du formulaire lead à partir du résultat / entrée
 * de simulation du workflow fiche CEE (parcours agent).
 */
export function mergeLeadFormDefaultsFromWorkflowSimulation(
  base: LeadFormInput,
  workflow: WorkflowScopedListRow | null | undefined,
): LeadFormInput {
  if (!workflow) {
    return base;
  }
  const snap = parseWorkflowSimulationSnapshotJson(workflow.simulation_input_json);
  const hasResult = simulationResultHasData(workflow.simulation_result_json);
  if (!hasResult && !snap) {
    return base;
  }
  const r = hasResult ? (workflow.simulation_result_json as Record<string, unknown>) : null;
  const out: LeadFormInput = { ...base };

  const surface = r ? toNum(r.surfaceM2) : null;
  const surfaceFromSnap = snap?.surfaceM2 ?? null;
  if (out.surface_m2 == null && surface != null) {
    out.surface_m2 = surface;
  }
  if (out.surface_m2 == null && surfaceFromSnap != null) {
    out.surface_m2 = surfaceFromSnap;
  }

  const skipCeilingHeightFromSim = snap != null && isPacPreferredLocalUsage(snap.localUsage);
  const height = r ? toNum(r.heightM) : null;
  const heightFromSnap = snap?.heightM ?? null;
  if (out.ceiling_height_m == null && height != null && !skipCeilingHeightFromSim) {
    out.ceiling_height_m = height;
  }
  if (out.ceiling_height_m == null && heightFromSnap != null && !skipCeilingHeightFromSim) {
    out.ceiling_height_m = heightFromSnap;
  }

  if (!out.heating_type?.length) {
    if (snap) {
      const fromSnap = leadHeatingTypesFromSimulator(snap.currentHeatingMode, snap.computedHeatingMode);
      if (fromSnap.length) {
        out.heating_type = [...fromSnap];
      }
    }
    if (!out.heating_type?.length && r && typeof r.heatingMode === "string") {
      const ht = heatingTypeFromSimulator(r.heatingMode);
      if (ht.length) {
        out.heating_type = [...ht];
      }
    }
  }

  if (!String(out.building_type ?? "").trim()) {
    if (snap) {
      const fromSnap = leadBuildingTypeFromSimulatorCee(snap.buildingType, snap.localUsage);
      if (fromSnap) {
        out.building_type = fromSnap;
      }
    }
    if (!String(out.building_type ?? "").trim() && r && typeof r.clientType === "string") {
      const bt = buildingTypeFromSimulatorClientType(r.clientType);
      if (bt) {
        out.building_type = bt;
      }
    }
  }

  const heated = extractBuildingHeatedForForm(workflow.simulation_input_json);
  if ((!out.heated_building || out.heated_building === "") && heated) {
    out.heated_building = heated;
  }
  if ((!out.heated_building || out.heated_building === "") && snap?.isHeated != null) {
    out.heated_building = snap.isHeated ? "true" : "false";
  }

  const score = r ? toNum(r.leadScore) : null;
  if ((out.ai_lead_score == null || out.ai_lead_score === undefined) && score != null) {
    out.ai_lead_score = Math.round(score);
  }

  return out;
}

const eurFmt = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function fmtEur(n: unknown): string | null {
  const v = toNum(n);
  if (v == null) return null;
  return eurFmt.format(v);
}

/**
 * Brouillon de notes de transmission closer à partir du résultat simulateur (texte brut).
 */
export function buildConfirmateurHandoverDraftFromSimulation(
  workflow: Pick<WorkflowScopedListRow, "simulation_result_json" | "cee_sheet">,
): string {
  const r = workflow.simulation_result_json;
  if (!r || typeof r !== "object" || Array.isArray(r)) {
    return "";
  }
  const o = r as Record<string, unknown>;
  const lines: string[] = [];
  lines.push("— Synthèse automatique (simulateur) —");
  if (workflow.cee_sheet?.label) {
    lines.push(`Fiche : ${workflow.cee_sheet.label}`);
  }
  if (typeof o.clientType === "string" && o.clientType.trim()) {
    lines.push(`Type de site : ${o.clientType}`);
  }
  const h = toNum(o.heightM);
  const s = toNum(o.surfaceM2);
  if (h != null) lines.push(`Hauteur sous plafond : ${h} m`);
  if (s != null) lines.push(`Surface : ${s} m²`);
  if (typeof o.heatingMode === "string" && o.heatingMode.trim()) {
    lines.push(`Mode chauffage (sim.) : ${o.heatingMode}`);
  }
  if (typeof o.model === "string" && o.model.trim()) {
    lines.push(`Modèle destrat. : ${o.model}`);
  }
  const score = toNum(o.leadScore);
  if (score != null) lines.push(`Score lead : ${Math.round(score)}`);
  const sav = fmtEur(o.savingEur30Selected);
  if (sav) lines.push(`Économie 30 % (est.) : ${sav}`);
  const prime = fmtEur(o.ceePrimeEstimated);
  if (prime) lines.push(`Prime CEE (est.) : ${prime}`);
  const rac = fmtEur(o.restToCharge);
  if (rac) lines.push(`Reste à charge (est.) : ${rac}`);
  lines.push("");
  lines.push("À valider avec le prospect et le dossier administratif.");
  return lines.join("\n");
}
