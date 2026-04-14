import type { CeeBuildingType } from "@/features/leads/simulator/domain/cee-solution-decision";
import { computeSimulator } from "@/features/leads/simulator/domain/simulator";
import type { SimulatorComputedResult } from "@/features/leads/simulator/domain/types";
import { toAgentDestratSimulatorInput } from "@/features/leads/simulator/lib/agent-form-to-input";
import {
  isDestratCurrentHeatingModeId,
  legacyCeeHeatingKindToCurrentMode,
} from "@/features/leads/simulator/lib/map-current-heating-mode-to-cee";
import { normalizeSimulatorInput, SimulateLeadSchema } from "@/features/leads/simulator/schemas/simulator.schema";
import {
  DEFAULT_DESTRAT_AGENT_FORM_STATE,
  type DestratAgentFormState,
} from "@/features/leads/simulator/types/destrat-agent-form-state";

export type AgentDestratFormState = DestratAgentFormState;
export const DEFAULT_AGENT_DESTRAT_STATE = DEFAULT_DESTRAT_AGENT_FORM_STATE;

export { toAgentDestratSimulatorInput };

/** @deprecated Utiliser `toAgentDestratSimulatorInput` — conservé pour imports externes éventuels */
export function toAgentDestratInput(state: AgentDestratFormState) {
  return toAgentDestratSimulatorInput(state);
}

export function computeAgentDestratPreview(
  state: AgentDestratFormState,
): { ok: true; result: SimulatorComputedResult } | { ok: false; message: string } {
  if (state.buildingHeated === "no") {
    return {
      ok: false,
      message: "Non éligible : sans chauffage, aucune solution CEE de ce simulateur ne s'applique.",
    };
  }
  if (state.buildingHeated !== "yes") {
    return { ok: false, message: "Indiquez si le bâtiment est chauffé pour lancer la simulation." };
  }
  const parsed = SimulateLeadSchema.safeParse(toAgentDestratSimulatorInput(state));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Simulation incomplète." };
  }
  return { ok: true, result: computeSimulator(normalizeSimulatorInput(parsed.data)) };
}

export function extractAgentDestratStateFromJson(payload: unknown): AgentDestratFormState {
  const fallback = { ...DEFAULT_AGENT_DESTRAT_STATE };
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return fallback;
  }

  const source =
    "input" in payload && payload.input && typeof payload.input === "object" && !Array.isArray(payload.input)
      ? (payload.input as Record<string, unknown>)
      : (payload as Record<string, unknown>);

  const buildingHeatedRaw = source.buildingHeated;
  const buildingHeated: AgentDestratFormState["buildingHeated"] =
    buildingHeatedRaw === "yes" || buildingHeatedRaw === "no" ? buildingHeatedRaw : "";

  const lu = source.localUsage;
  const migrated = migrateLegacyClientTypeToForm(source);

  const currentHeatingMode: AgentDestratFormState["currentHeatingMode"] =
    (typeof source.currentHeatingMode === "string" && isDestratCurrentHeatingModeId(source.currentHeatingMode)
      ? source.currentHeatingMode
      : "") ||
    legacyCeeHeatingKindToCurrentMode(typeof source.heatingType === "string" ? source.heatingType : "") ||
    migrated.currentHeatingMode ||
    "";

  return {
    buildingHeated,
    localUsage: typeof lu === "string" ? (lu as AgentDestratFormState["localUsage"]) : "",
    heightM:
      typeof source.heightM === "number"
        ? String(source.heightM)
        : typeof source.heightM === "string"
          ? source.heightM
          : fallback.heightM,
    surfaceM2:
      typeof source.surfaceM2 === "number"
        ? String(source.surfaceM2)
        : typeof source.surfaceM2 === "string"
          ? source.surfaceM2
          : fallback.surfaceM2,
    model: typeof source.model === "string" ? (source.model as AgentDestratFormState["model"]) : "",
    consigne: typeof source.consigne === "string" ? source.consigne : "",
    ...migrated,
    currentHeatingMode,
  };
}

function defaultLocalUsageFromBuildingType(bt: CeeBuildingType): AgentDestratFormState["localUsage"] {
  if (bt === "tertiaire") return "bureau";
  if (bt === "industriel") return "atelier";
  if (bt === "logistique") return "logistique";
  return "autre";
}

function migrateLegacyClientTypeToForm(source: Record<string, unknown>): Partial<AgentDestratFormState> {
  const out: Partial<AgentDestratFormState> = {};
  const hasLocalUsage = typeof source.localUsage === "string" && source.localUsage.trim() !== "";

  if (!hasLocalUsage && typeof source.buildingType === "string" && source.buildingType) {
    out.localUsage = defaultLocalUsageFromBuildingType(source.buildingType as CeeBuildingType);
  }

  if (!hasLocalUsage && !out.localUsage) {
    const ct = source.clientType;
    if (typeof ct === "string" && ct.trim()) {
      if (ct === "Tertiaire") out.localUsage = "bureau";
      else if (ct === "Site industriel / logistique") out.localUsage = "atelier";
      else out.localUsage = "autre";
    }
  }

  const hasHeatingHint =
    (typeof source.currentHeatingMode === "string" && isDestratCurrentHeatingModeId(source.currentHeatingMode)) ||
    (typeof source.heatingType === "string" && legacyCeeHeatingKindToCurrentMode(source.heatingType) !== "");

  if (!hasHeatingHint && typeof source.heatingMode === "string" && source.heatingMode) {
    out.currentHeatingMode = source.heatingMode === "elec" ? "electrique_direct" : "air_chaud_soufflage";
  }
  return out;
}
