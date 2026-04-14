import {
  decideCeeSolution,
  type CeeDecisionInput,
} from "@/features/leads/simulator/domain/cee-solution-decision";
import { tryCalculatePacSavingsFromSimulatorInput } from "@/features/leads/simulator/pac/build-pac-project-from-simulator-input";
import type {
  ClientType,
  CeeBuildingType,
  CeeHeatingKind,
  DestratCurrentHeatingModeId,
  DestratModel,
  HeatingMode,
  LeadSimulationSnapshot,
  SimulatorComputedResult,
  SimulatorInput,
} from "@/features/leads/simulator/domain/types";

/**
 * Constantes métier du simulateur.
 * Modifier ici pour ajuster les hypothèses commerciales globales.
 */
export const SIMULATOR_CONSTANTS = {
  /** Écart de température (°C) pris en compte pour le besoin thermique de renouvellement d’air. */
  DELTA_T_DEFAULT: 25,
  /**
   * Heures de chauffe par défaut (tertiaire) — préférer `getOperatingHoursPerYear`.
   * @deprecated Conservé pour scripts / snapshots historiques.
   */
  HEURES_CHAUFFAGE_AN: 1850,
  /** Coefficient simplifié Wh/(m³·h·K) pour passer débit d’air × ΔT → puissance. */
  HEAT_CAPACITY: 0.34,
  /** Facteur kg CO₂ évités / kWh économisé (ordre de grandeur France, mix énergétique). */
  EMISSION_FACTOR_KG_PER_KWH: 0.085,
  /** Hauteur minimale saisissable (m) — en dessous de 5 m la déstrat n'est pas proposée (PAC si éligible). */
  HEIGHT_MIN: 2.5,
  HEIGHT_MAX: 15,
  SURFACE_MIN: 800,
  SURFACE_MAX: 10000,
  VERSION: "sim-v2",
} as const;

export const HEATING_MODE_PRICE_KWH: Record<HeatingMode, number> = {
  bois: 0.075,
  gaz: 0.105,
  fioul: 0.115,
  elec: 0.2016,
  pac: 0.06,
};

export const MODEL_CAPACITY_M3H: Record<DestratModel, number> = {
  teddington_ds3: 2330,
  teddington_ds7: 6500,
  generfeu: 10000,
};

export const MODEL_INSTALL_UNIT_PRICE_EUR: Record<DestratModel, number> = {
  teddington_ds3: 1250,
  teddington_ds7: 1350,
  generfeu: 2150,
};

/** Entrée « moteur déstrat » uniquement (économies / CEE). */
export type DestratEconomicsInput = {
  clientType: ClientType;
  heightM: number;
  surfaceM2: number;
  heatingMode: HeatingMode;
  model: DestratModel;
  consigne: string | null;
};

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Renouvellements d’air volumiques (vol/h) — ordres de grandeur locaux grands volumes. */
export function getAirChangeRate(clientType: ClientType): number {
  if (clientType === "Site industriel / logistique") return 2.8;
  if (clientType === "Collectivité") return 2.35;
  return 1.9;
}

/**
 * Heures annuelles de fonctionnement chauffage selon le type de site (France, tertiaire / public / industriel).
 */
export function getOperatingHoursPerYear(clientType: ClientType): number {
  if (clientType === "Site industriel / logistique") return 3600;
  if (clientType === "Collectivité") return 2200;
  return 1850;
}

/**
 * Part des économies de chauffage attribuée à la déstrat (gradient vertical plus marqué quand la hauteur augmente).
 */
export function getDestratSavingFraction(heightM: number): number {
  const h = clamp(heightM, SIMULATOR_CONSTANTS.HEIGHT_MIN, SIMULATOR_CONSTANTS.HEIGHT_MAX);
  if (h < 6) return 0.2;
  if (h < 8) return 0.26;
  if (h < 11) return 0.3;
  return 0.34;
}

/**
 * Énergie portée par le mode de chauffage détaillé (agent) ; sinon repli sur la famille CEE.
 * Rayonnement industriel (gaz) → prix gaz, pas électricité.
 */
export function heatingModeForEnergyCost(
  currentHeatingMode: DestratCurrentHeatingModeId | null | undefined,
  heatingType: CeeHeatingKind,
): HeatingMode {
  if (currentHeatingMode) {
    switch (currentHeatingMode) {
      case "electrique_direct":
        return "elec";
      case "pac_air_air":
      case "pac_air_eau":
        return "pac";
      case "air_chaud_soufflage":
      case "rayonnement":
      case "mix_air_rayonnement":
      case "chaudiere_eau":
      case "autre_inconnu":
        return "gaz";
      default:
        break;
    }
  }
  return mapCeeHeatingToLegacy(heatingType);
}

export function getModelCapacity(model: DestratModel): number {
  return MODEL_CAPACITY_M3H[model];
}

export function getSuggestedModel(heightM: number): DestratModel {
  if (heightM < 6) return "teddington_ds3";
  if (heightM < 7) return "teddington_ds7";
  return "generfeu";
}

export function getInstallUnitPrice(model: DestratModel): number {
  return MODEL_INSTALL_UNIT_PRICE_EUR[model];
}

export function computePrimeCEE(clientType: ClientType, puissanceChauffageKw: number): number {
  const factor = clientType === "Site industriel / logistique" ? 7.1 : 3.9;
  return round(factor * puissanceChauffageKw * 7.3, 2);
}

export function computeInstallCost(model: DestratModel, nbDestratificateurs: number): {
  installUnitPrice: number;
  installTotalPrice: number;
} {
  const installUnitPrice = getInstallUnitPrice(model);
  return {
    installUnitPrice,
    installTotalPrice: round(installUnitPrice * nbDestratificateurs, 2),
  };
}

export function computeLeadScore(params: {
  surfaceM2: number;
  heightM: number;
  clientType: ClientType;
  saving30EuroSelected: number;
  restToCharge: number;
}): number {
  const surfaceRatio =
    (clamp(params.surfaceM2, SIMULATOR_CONSTANTS.SURFACE_MIN, SIMULATOR_CONSTANTS.SURFACE_MAX) -
      SIMULATOR_CONSTANTS.SURFACE_MIN) /
    (SIMULATOR_CONSTANTS.SURFACE_MAX - SIMULATOR_CONSTANTS.SURFACE_MIN);
  const surfaceScore = round(surfaceRatio * 25, 0);

  const heightRatio =
    (clamp(params.heightM, SIMULATOR_CONSTANTS.HEIGHT_MIN, SIMULATOR_CONSTANTS.HEIGHT_MAX) -
      SIMULATOR_CONSTANTS.HEIGHT_MIN) /
    (SIMULATOR_CONSTANTS.HEIGHT_MAX - SIMULATOR_CONSTANTS.HEIGHT_MIN);
  const heightScore = round(heightRatio * 15, 0);

  const clientTypeScore =
    params.clientType === "Site industriel / logistique"
      ? 25
      : params.clientType === "Collectivité"
        ? 18
        : 12;

  const economyScore = round(clamp(params.saving30EuroSelected, 0, 20000) / 20000 * 20, 0);

  let restScore = 0;
  if (params.restToCharge <= 0) restScore = 15;
  else if (params.restToCharge <= 5000) restScore = 12;
  else if (params.restToCharge <= 10000) restScore = 8;
  else if (params.restToCharge <= 20000) restScore = 4;

  return clamp(surfaceScore + heightScore + clientTypeScore + economyScore + restScore, 0, 100);
}

export function mapBuildingTypeToClientType(buildingType: CeeBuildingType): ClientType {
  if (buildingType === "tertiaire") return "Tertiaire";
  if (buildingType === "industriel" || buildingType === "logistique") {
    return "Site industriel / logistique";
  }
  return "Collectivité";
}

export function mapCeeHeatingToLegacy(heatingType: CeeHeatingKind): HeatingMode {
  switch (heatingType) {
    case "radiatif":
      return "elec";
    case "convectif":
    case "mixte":
    case "autre":
    default:
      return "gaz";
  }
}

export function toDestratEconomicsInput(input: SimulatorInput): DestratEconomicsInput {
  return {
    clientType: mapBuildingTypeToClientType(input.buildingType),
    heightM: clamp(input.heightM, SIMULATOR_CONSTANTS.HEIGHT_MIN, SIMULATOR_CONSTANTS.HEIGHT_MAX),
    surfaceM2: clamp(input.surfaceM2, SIMULATOR_CONSTANTS.SURFACE_MIN, SIMULATOR_CONSTANTS.SURFACE_MAX),
    heatingMode: heatingModeForEnergyCost(input.currentHeatingMode ?? null, input.heatingType),
    model: input.model,
    consigne: input.consigne?.trim() ? input.consigne.trim() : null,
  };
}

function toCeeDecisionInput(input: SimulatorInput): CeeDecisionInput {
  return {
    isHeated: input.isHeated,
    isClosed: input.isClosed,
    buildingAgeMoreThan2Years: input.buildingAgeMoreThan2Years,
    buildingType: input.buildingType,
    localUsage: input.localUsage,
    heightM: clamp(input.heightM, SIMULATOR_CONSTANTS.HEIGHT_MIN, SIMULATOR_CONSTANTS.HEIGHT_MAX),
    setpointTemp: input.setpointTemp,
    need: input.need,
  };
}

/** Calcul chiffré déstrat (sans décision CEE). Exposé pour les tests unitaires. */
export function computeDestratEconomics(raw: DestratEconomicsInput): Omit<SimulatorComputedResult, "ceeSolution"> {
  const heightM = clamp(raw.heightM, SIMULATOR_CONSTANTS.HEIGHT_MIN, SIMULATOR_CONSTANTS.HEIGHT_MAX);
  const surfaceM2 = clamp(raw.surfaceM2, SIMULATOR_CONSTANTS.SURFACE_MIN, SIMULATOR_CONSTANTS.SURFACE_MAX);
  const airChangeRate = getAirChangeRate(raw.clientType);
  const modelCapacityM3h = getModelCapacity(raw.model);
  const volumeM3 = round(heightM * surfaceM2, 2);

  const neededDestrat = Math.max(1, Math.ceil((volumeM3 * airChangeRate) / modelCapacityM3h));
  const powerKw = round(
    (volumeM3 * airChangeRate * SIMULATOR_CONSTANTS.DELTA_T_DEFAULT * SIMULATOR_CONSTANTS.HEAT_CAPACITY) / 1000,
    4,
  );
  const hoursYear = getOperatingHoursPerYear(raw.clientType);
  const savingFrac = getDestratSavingFraction(heightM);
  const consumptionKwhYear = round(powerKw * hoursYear, 2);
  const kwhPriceLow = Math.min(...Object.values(HEATING_MODE_PRICE_KWH));
  const kwhPriceHigh = Math.max(...Object.values(HEATING_MODE_PRICE_KWH));
  const costYearMin = round(consumptionKwhYear * kwhPriceLow, 2);
  const costYearMax = round(consumptionKwhYear * kwhPriceHigh, 2);
  const savingKwh30 = round(consumptionKwhYear * savingFrac, 2);
  const savingEur30Min = round(costYearMin * savingFrac, 2);
  const savingEur30Max = round(costYearMax * savingFrac, 2);

  const selectedKwhPrice = HEATING_MODE_PRICE_KWH[raw.heatingMode];
  const costYearSelected = round(consumptionKwhYear * selectedKwhPrice, 2);
  const savingEur30Selected = round(costYearSelected * savingFrac, 2);
  const co2SavedTons = round(
    (savingKwh30 * SIMULATOR_CONSTANTS.EMISSION_FACTOR_KG_PER_KWH) / 1000,
    4,
  );

  const ceePrimeEstimated = computePrimeCEE(raw.clientType, powerKw);
  const { installUnitPrice, installTotalPrice } = computeInstallCost(raw.model, neededDestrat);
  const restToCharge = round(installTotalPrice - ceePrimeEstimated, 2);

  const leadScore = computeLeadScore({
    surfaceM2,
    heightM,
    clientType: raw.clientType,
    saving30EuroSelected: savingEur30Selected,
    restToCharge,
  });

  return {
    clientType: raw.clientType,
    heightM,
    surfaceM2,
    heatingMode: raw.heatingMode,
    model: raw.model,
    consigne: raw.consigne,
    volumeM3,
    airChangeRate,
    modelCapacityM3h,
    neededDestrat,
    powerKw,
    consumptionKwhYear,
    costYearMin,
    costYearMax,
    costYearSelected,
    savingKwh30,
    savingEur30Min,
    savingEur30Max,
    savingEur30Selected,
    co2SavedTons,
    ceePrimeEstimated,
    installUnitPrice,
    installTotalPrice,
    restToCharge,
    leadScore,
  };
}

function buildNonDestratEconomics(input: SimulatorInput): Omit<SimulatorComputedResult, "ceeSolution"> {
  const eco = toDestratEconomicsInput(input);
  return {
    clientType: eco.clientType,
    heightM: eco.heightM,
    surfaceM2: eco.surfaceM2,
    heatingMode: eco.heatingMode,
    model: eco.model,
    consigne: eco.consigne,
    volumeM3: 0,
    airChangeRate: 0,
    modelCapacityM3h: 0,
    neededDestrat: 0,
    powerKw: 0,
    consumptionKwhYear: 0,
    costYearMin: 0,
    costYearMax: 0,
    costYearSelected: 0,
    savingKwh30: 0,
    savingEur30Min: 0,
    savingEur30Max: 0,
    savingEur30Selected: 0,
    co2SavedTons: 0,
    ceePrimeEstimated: 0,
    installUnitPrice: 0,
    installTotalPrice: 0,
    restToCharge: 0,
    leadScore: 0,
  };
}

/**
 * Simulateur complet : décision CEE unique (DESTRAT / PAC / NONE) + chiffres déstrat uniquement si DESTRAT.
 */
export function computeSimulator(input: SimulatorInput): SimulatorComputedResult {
  const ceeSolution = decideCeeSolution(toCeeDecisionInput(input), {
    currentHeatingMode: input.currentHeatingMode ?? null,
  });

  if (ceeSolution.solution === "DESTRAT") {
    const economics = computeDestratEconomics(toDestratEconomicsInput(input));
    return { ...economics, ceeSolution };
  }

  const nonDestrat = buildNonDestratEconomics(input);

  if (ceeSolution.solution === "PAC") {
    const eco = toDestratEconomicsInput(input);
    const pacSavings = tryCalculatePacSavingsFromSimulatorInput({
      buildingType: input.buildingType,
      surfaceM2: input.surfaceM2,
      currentHeatingMode: input.currentHeatingMode,
      legacyHeatingMode: eco.heatingMode,
      energyPriceByMode: HEATING_MODE_PRICE_KWH,
    });
    return { ...nonDestrat, ceeSolution, pacSavings };
  }

  return {
    ...nonDestrat,
    ceeSolution,
  };
}

export function buildSimulationSnapshot(input: SimulatorInput): LeadSimulationSnapshot {
  const result = computeSimulator(input);
  const eco = toDestratEconomicsInput(input);
  return {
    version: SIMULATOR_CONSTANTS.VERSION,
    simulatedAtIso: new Date().toISOString(),
    input,
    normalizedInput: {
      clientType: eco.clientType,
      heightM: result.heightM,
      surfaceM2: result.surfaceM2,
      heatingMode: eco.heatingMode,
      model: result.model,
      consigne: result.consigne,
      isHeated: input.isHeated,
      isClosed: input.isClosed,
      buildingType: input.buildingType,
      localUsage: input.localUsage,
      setpointTemp: input.setpointTemp,
      heatingType: input.heatingType,
      currentHeatingMode: input.currentHeatingMode ?? null,
      need: input.need,
      buildingAgeMoreThan2Years: input.buildingAgeMoreThan2Years,
    },
    result,
  };
}
