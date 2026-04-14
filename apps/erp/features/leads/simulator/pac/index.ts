export {
  buildPacProjectInputFromSimulator,
  clientTypeFromCeeBuildingType,
  DEFAULT_PAC_SCOP_AIR_EAU,
  mapDestratCurrentHeatingModeToHeatingSystemType,
  tryCalculatePacSavingsFromSimulatorInput,
} from "@/features/leads/simulator/pac/build-pac-project-from-simulator-input";
export { buildCommercialMessage } from "@/features/leads/simulator/pac/build-commercial-message";
export { calculatePacSavings } from "@/features/leads/simulator/pac/calculate-pac-savings";
export { getDefaultCurrentEfficiency, resolveCurrentEfficiency } from "@/features/leads/simulator/pac/default-efficiency";
export { getPacSavingsBand } from "@/features/leads/simulator/pac/get-pac-savings-band";
export type {
  HeatingSystemType,
  PacProjectInput,
  PacSavingsBand,
  PacSavingsResult,
  PacValidationIssue,
} from "@/features/leads/simulator/pac/types";
export {
  collectPacProjectValidationIssues,
  PacProjectValidationError,
  validatePacProjectInput,
} from "@/features/leads/simulator/pac/validate-pac-project-input";
