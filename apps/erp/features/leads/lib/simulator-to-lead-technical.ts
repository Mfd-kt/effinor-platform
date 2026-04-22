// TODO: Le simulateur CEE (features/leads/simulator + features/cee-workflows) a été retiré.
// Les fonctions ci-dessous gardent leur signature mais retournent des valeurs neutres jusqu'à
// la mise en place du nouveau pipeline de simulation.

import type { BuildingType } from "@/features/leads/lib/building-types";
import type { HeatingMode } from "@/features/leads/lib/heating-modes";

export type ParsedWorkflowSimulationSnapshot = {
  surfaceM2: number | null;
  heightM: number | null;
  buildingType: any;
  localUsage: any;
  currentHeatingMode: any;
  computedHeatingMode: any;
  isHeated: boolean | null;
};

export function leadBuildingTypeFromSimulatorCee(
  _buildingType: any,
  _localUsage: any,
): BuildingType | undefined {
  return undefined;
}

export function leadHeatingTypesFromSimulator(
  _currentHeatingMode: any,
  _computedHeatingMode: any,
): HeatingMode[] {
  return [];
}

export function extractCurrentHeatingModeFromSimulationInputJson(_raw: unknown): any {
  return null;
}

export function leadHeatingTypesFromSimulationPayloads(
  _simulationInputJson: unknown,
  _simulationResultJson: unknown,
): HeatingMode[] {
  return [];
}

export function parseWorkflowSimulationSnapshotJson(_raw: unknown): ParsedWorkflowSimulationSnapshot | null {
  return null;
}
