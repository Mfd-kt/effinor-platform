import type { DestratCurrentHeatingModeId } from "@/features/leads/simulator/domain/types";
import type { DESTRAT_MODEL_VALUES, LOCAL_USAGE_VALUES } from "@/features/leads/simulator/schemas/simulator.schema";

export type DestratAgentFormState = {
  buildingHeated: "yes" | "no" | "";
  localUsage: (typeof LOCAL_USAGE_VALUES)[number] | "";
  heightM: string;
  surfaceM2: string;
  currentHeatingMode: DestratCurrentHeatingModeId | "";
  model: (typeof DESTRAT_MODEL_VALUES)[number] | "";
  consigne: string;
};

export const DEFAULT_DESTRAT_AGENT_FORM_STATE: DestratAgentFormState = {
  buildingHeated: "",
  localUsage: "",
  heightM: "5",
  surfaceM2: "800",
  currentHeatingMode: "",
  model: "teddington_ds3",
  consigne: "",
};
