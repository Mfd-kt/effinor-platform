import { isPacPreferredLocalUsage } from "@/features/leads/simulator/domain/cee-solution-decision";
import type { CeeHeatingKind, DestratCurrentHeatingModeId, LocalUsageId } from "@/features/leads/simulator/domain/types";
import { mapDestratCurrentHeatingModeToCeeHeatingKind } from "@/features/leads/simulator/lib/map-current-heating-mode-to-cee";
import { inferBuildingTypeFromLocalUsage } from "@/features/leads/simulator/lib/local-usage-building-type";
import type { DestratAgentFormState } from "@/features/leads/simulator/types/destrat-agent-form-state";

function parseNumber(raw: string): number {
  return Number(String(raw).replace(",", "."));
}

export function toAgentDestratSimulatorInput(state: DestratAgentFormState) {
  const usageKey = (state.localUsage || "autre") as LocalUsageId;
  const heightM = isPacPreferredLocalUsage(state.localUsage) ? 5 : parseNumber(state.heightM);
  return {
    isHeated: state.buildingHeated === "yes",
    buildingType: inferBuildingTypeFromLocalUsage(usageKey),
    localUsage: state.localUsage,
    heightM,
    surfaceM2: parseNumber(state.surfaceM2),
    heatingType: state.currentHeatingMode
      ? mapDestratCurrentHeatingModeToCeeHeatingKind(state.currentHeatingMode)
      : ("autre" as CeeHeatingKind),
    currentHeatingMode: state.currentHeatingMode || undefined,
    model: state.model,
    consigne: state.consigne || undefined,
  };
}
