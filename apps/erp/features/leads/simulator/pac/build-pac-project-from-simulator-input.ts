import type {
  CeeBuildingType,
  ClientType,
  DestratCurrentHeatingModeId,
  HeatingMode,
} from "@/features/leads/simulator/domain/types";
import { calculatePacSavings } from "@/features/leads/simulator/pac/calculate-pac-savings";
import type { HeatingSystemType, PacProjectInput, PacSavingsResult } from "@/features/leads/simulator/pac/types";

/** SCOP saisonnier air/eau — hypothèse commerciale prudente (à affiner par étude). */
export const DEFAULT_PAC_SCOP_AIR_EAU = 3.1;

/**
 * Besoin annuel de chauffage utile (kWh/m²) — ordres de grandeur France, usage tertiaire / industriel / public.
 */
const ANNUAL_HEATING_NEED_KWH_PER_M2: Record<ClientType, number> = {
  Tertiaire: 110,
  "Site industriel / logistique": 125,
  Collectivité: 100,
};

export function clientTypeFromCeeBuildingType(bt: CeeBuildingType): ClientType {
  if (bt === "tertiaire") return "Tertiaire";
  if (bt === "industriel" || bt === "logistique") return "Site industriel / logistique";
  return "Collectivité";
}

/**
 * Rattache le mode détaillé agent au référentiel `HeatingSystemType` du moteur PAC.
 */
export function mapDestratCurrentHeatingModeToHeatingSystemType(
  mode: DestratCurrentHeatingModeId | null | undefined,
): HeatingSystemType {
  switch (mode) {
    case "air_chaud_soufflage":
      return "rooftop_cta_air_chaud";
    case "rayonnement":
      return "radiant_gaz";
    case "mix_air_rayonnement":
      return "autre";
    case "chaudiere_eau":
      return "reseau_eau_chaude";
    case "electrique_direct":
      return "chauffage_electrique_direct";
    case "pac_air_air":
    case "pac_air_eau":
      return "aerotherme_electrique";
    case "autre_inconnu":
      return "autre";
    default:
      return "autre";
  }
}

export function buildPacProjectInputFromSimulator(params: {
  buildingType: CeeBuildingType;
  surfaceM2: number;
  currentHeatingMode?: DestratCurrentHeatingModeId | null;
  legacyHeatingMode: HeatingMode;
  energyPriceByMode: Record<HeatingMode, number>;
  pacScop?: number;
}): PacProjectInput {
  const clientType = clientTypeFromCeeBuildingType(params.buildingType);
  return {
    surfaceM2: params.surfaceM2,
    annualHeatingNeedKwhPerM2: ANNUAL_HEATING_NEED_KWH_PER_M2[clientType],
    currentHeatingSystem: mapDestratCurrentHeatingModeToHeatingSystemType(params.currentHeatingMode),
    pacScop: params.pacScop ?? DEFAULT_PAC_SCOP_AIR_EAU,
    currentEnergyPricePerKwh: params.energyPriceByMode[params.legacyHeatingMode],
    pacElectricPricePerKwh: params.energyPriceByMode.elec,
  };
}

/**
 * Chiffre PAC « théorique » pour l’UI / le lead ; `null` si entrées invalides (ne doit pas bloquer le flux CEE).
 */
export function tryCalculatePacSavingsFromSimulatorInput(params: {
  buildingType: CeeBuildingType;
  surfaceM2: number;
  currentHeatingMode?: DestratCurrentHeatingModeId | null;
  legacyHeatingMode: HeatingMode;
  energyPriceByMode: Record<HeatingMode, number>;
  pacScop?: number;
}): PacSavingsResult | null {
  try {
    return calculatePacSavings(buildPacProjectInputFromSimulator(params));
  } catch {
    return null;
  }
}
