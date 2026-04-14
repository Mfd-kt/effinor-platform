import type { CeeBuildingType, LocalUsageId } from "@/features/leads/simulator/domain/cee-solution-decision";
import type {
  DestratCurrentHeatingModeId,
  HeatingMode as SimHeatingMode,
} from "@/features/leads/simulator/domain/types";
import type { BuildingType } from "@/features/leads/lib/building-types";
import type { HeatingMode } from "@/features/leads/lib/heating-modes";
import { isDestratCurrentHeatingModeId } from "@/features/leads/simulator/lib/map-current-heating-mode-to-cee";

const SIM_HEATING: ReadonlySet<string> = new Set(["bois", "gaz", "fioul", "elec", "pac"]);

function isCeeBuildingType(v: unknown): v is CeeBuildingType {
  return v === "tertiaire" || v === "industriel" || v === "logistique" || v === "autre";
}

const LOCAL_USAGE_IDS = new Set<LocalUsageId>([
  "bureau",
  "commerce",
  "sante",
  "enseignement",
  "hotellerie_restauration",
  "atelier",
  "hall_production",
  "gymnase",
  "stockage",
  "entrepot",
  "logistique",
  "reserve",
  "autre",
]);

function isLocalUsageId(v: unknown): v is LocalUsageId {
  return typeof v === "string" && LOCAL_USAGE_IDS.has(v as LocalUsageId);
}

function isSimHeatingMode(v: unknown): v is SimHeatingMode {
  return typeof v === "string" && SIM_HEATING.has(v);
}

function heatingModesFromSimComputed(mode: SimHeatingMode): HeatingMode[] {
  switch (mode) {
    case "gaz":
    case "fioul":
      return ["chaudiere_eau"];
    case "pac":
      return ["pac_air_eau"];
    case "elec":
      return ["electrique_direct"];
    case "bois":
      return ["autre_inconnu"];
    default:
      return [];
  }
}

export type ParsedWorkflowSimulationSnapshot = {
  surfaceM2: number | null;
  heightM: number | null;
  buildingType: CeeBuildingType;
  localUsage: LocalUsageId;
  currentHeatingMode: DestratCurrentHeatingModeId | null;
  computedHeatingMode: SimHeatingMode | null;
  isHeated: boolean | null;
};

function toFiniteNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(String(v).trim().replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Type de bâtiment lead (enum DB) à partir des choix CEE du simulateur.
 */
export function leadBuildingTypeFromSimulatorCee(
  buildingType: CeeBuildingType,
  localUsage: LocalUsageId,
): BuildingType | undefined {
  if (buildingType === "industriel" || buildingType === "logistique") {
    return "INDUSTRIE";
  }
  if (buildingType === "autre") {
    return "AUTRES";
  }
  switch (localUsage) {
    case "commerce":
      return "COMMERCES";
    case "sante":
      return "SANTÉ";
    case "enseignement":
      return "ENSEIGNEMENT";
    case "hotellerie_restauration":
      return "HÔTELLERIE";
    case "gymnase":
      return "SPORT";
    case "atelier":
    case "hall_production":
      return "INDUSTRIE";
    default:
      return "TERTIAIRE";
  }
}

/**
 * Codes `heating_type` (lead) : priorité au mode détaillé agent, sinon repli sur le mode calculé simulateur.
 */
export function leadHeatingTypesFromSimulator(
  currentHeatingMode: DestratCurrentHeatingModeId | null | undefined,
  computedHeatingMode: SimHeatingMode | null | undefined,
): HeatingMode[] {
  if (currentHeatingMode) {
    return [currentHeatingMode];
  }
  if (computedHeatingMode) {
    const mapped = heatingModesFromSimComputed(computedHeatingMode);
    return mapped.length ? [...mapped] : [];
  }
  return [];
}

/**
 * Poste agent : `currentHeatingMode` est souvent à la racine du JSON (spread `destratState`),
 * sans `buildingType` / `localUsage` CEE dans `input` — `parseWorkflowSimulationSnapshotJson` ne suffit pas.
 */
export function extractCurrentHeatingModeFromSimulationInputJson(raw: unknown): DestratCurrentHeatingModeId | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const root = raw as Record<string, unknown>;
  const input = root.input && typeof root.input === "object" && !Array.isArray(root.input)
    ? (root.input as Record<string, unknown>)
    : null;
  const normalizedInput =
    root.normalizedInput && typeof root.normalizedInput === "object" && !Array.isArray(root.normalizedInput)
      ? (root.normalizedInput as Record<string, unknown>)
      : null;
  const currentRaw =
    root.currentHeatingMode ?? input?.currentHeatingMode ?? normalizedInput?.currentHeatingMode;
  return typeof currentRaw === "string" && isDestratCurrentHeatingModeId(currentRaw) ? currentRaw : null;
}

function extractComputedHeatingModeFromSimulationContext(
  simulationInputJson: unknown,
  simulationResultJson: unknown,
): SimHeatingMode | null {
  if (simulationResultJson && typeof simulationResultJson === "object" && !Array.isArray(simulationResultJson)) {
    const ro = simulationResultJson as Record<string, unknown>;
    const nested =
      ro.result && typeof ro.result === "object" && !Array.isArray(ro.result)
        ? (ro.result as Record<string, unknown>)
        : ro;
    const hm = nested.heatingMode;
    if (isSimHeatingMode(hm)) return hm;
  }
  if (!simulationInputJson || typeof simulationInputJson !== "object" || Array.isArray(simulationInputJson)) {
    return null;
  }
  const root = simulationInputJson as Record<string, unknown>;
  const inputInner = root.input && typeof root.input === "object" && !Array.isArray(root.input)
    ? (root.input as Record<string, unknown>)
    : null;
  const norm =
    root.normalizedInput && typeof root.normalizedInput === "object" && !Array.isArray(root.normalizedInput)
      ? (root.normalizedInput as Record<string, unknown>)
      : null;
  const hm2 = inputInner?.heatingMode ?? norm?.heatingMode ?? root.heatingMode;
  return isSimHeatingMode(hm2) ? hm2 : null;
}

/** Déduit `heating_type` lead à partir des JSON simulation (workflow ou `sim_payload_json`). */
export function leadHeatingTypesFromSimulationPayloads(
  simulationInputJson: unknown,
  simulationResultJson: unknown,
): HeatingMode[] {
  const full = parseWorkflowSimulationSnapshotJson(simulationInputJson);
  const current =
    full?.currentHeatingMode ?? extractCurrentHeatingModeFromSimulationInputJson(simulationInputJson);
  const computed =
    full?.computedHeatingMode ??
    extractComputedHeatingModeFromSimulationContext(simulationInputJson, simulationResultJson);
  return leadHeatingTypesFromSimulator(current, computed);
}

/**
 * Extrait les champs techniques depuis `simulation_input_json` (snapshot complet) ou `sim_payload_json` lead.
 */
export function parseWorkflowSimulationSnapshotJson(raw: unknown): ParsedWorkflowSimulationSnapshot | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const root = raw as Record<string, unknown>;

  const input =
    root.input && typeof root.input === "object" && !Array.isArray(root.input)
      ? (root.input as Record<string, unknown>)
      : null;
  const normalizedInput =
    root.normalizedInput && typeof root.normalizedInput === "object" && !Array.isArray(root.normalizedInput)
      ? (root.normalizedInput as Record<string, unknown>)
      : null;
  const result =
    root.result && typeof root.result === "object" && !Array.isArray(root.result)
      ? (root.result as Record<string, unknown>)
      : null;

  const src = input ?? normalizedInput;
  if (!src) return null;

  const buildingTypeRaw = src.buildingType ?? normalizedInput?.buildingType;
  const localUsageRaw = src.localUsage ?? normalizedInput?.localUsage;
  if (!isCeeBuildingType(buildingTypeRaw) || !isLocalUsageId(localUsageRaw)) {
    return null;
  }

  const surfaceM2 =
    toFiniteNumber(src.surfaceM2) ??
    toFiniteNumber(normalizedInput?.surfaceM2) ??
    toFiniteNumber(result?.surfaceM2);
  const heightM =
    toFiniteNumber(src.heightM) ??
    toFiniteNumber(normalizedInput?.heightM) ??
    toFiniteNumber(result?.heightM);

  const currentRaw = src.currentHeatingMode ?? normalizedInput?.currentHeatingMode;
  const currentHeatingMode =
    typeof currentRaw === "string" && isDestratCurrentHeatingModeId(currentRaw) ? currentRaw : null;

  const hmRaw = normalizedInput?.heatingMode ?? result?.heatingMode;
  const computedHeatingMode = isSimHeatingMode(hmRaw) ? hmRaw : null;

  let isHeated: boolean | null = null;
  const heatedRaw = src.isHeated ?? normalizedInput?.isHeated ?? root.isHeated;
  if (typeof heatedRaw === "boolean") {
    isHeated = heatedRaw;
  }

  return {
    surfaceM2,
    heightM,
    buildingType: buildingTypeRaw,
    localUsage: localUsageRaw,
    currentHeatingMode,
    computedHeatingMode,
    isHeated,
  };
}
