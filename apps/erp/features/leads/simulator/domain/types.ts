import type {
  CeeBuildingType,
  CeeHeatingKind,
  CeeNeed,
  CeeSolutionDecision,
  LocalUsageId,
} from "@/features/leads/simulator/domain/cee-solution-decision";
import type { PacSavingsResult } from "@/features/leads/simulator/pac/types";

export type HeatingMode = "bois" | "gaz" | "fioul" | "elec" | "pac";

export type ClientType = "Site industriel / logistique" | "Collectivité" | "Tertiaire";

export type DestratModel = "teddington_ds3" | "teddington_ds7" | "generfeu";

/** Mode de chauffage détaillé (formulaire agent) — pilote le €/kWh et complète `heatingType`. */
export type DestratCurrentHeatingModeId =
  | "air_chaud_soufflage"
  | "rayonnement"
  | "mix_air_rayonnement"
  | "chaudiere_eau"
  | "electrique_direct"
  | "autre_inconnu";

export type { CeeBuildingType, CeeHeatingKind, CeeNeed, LocalUsageId, CeeSolutionDecision };

/** Entrée complète simulateur (CEE + champs calcul déstrat). */
export type SimulatorInput = {
  isHeated: boolean;
  isClosed: boolean;
  buildingAgeMoreThan2Years: boolean;
  buildingType: CeeBuildingType;
  localUsage: LocalUsageId;
  heightM: number;
  surfaceM2: number;
  setpointTemp: number;
  heatingType: CeeHeatingKind;
  /** Si renseigné : prix énergie et profil plus réalistes (ex. rayonnement → gaz). */
  currentHeatingMode?: DestratCurrentHeatingModeId | null;
  need: CeeNeed;
  model: DestratModel;
  consigne?: string | null;
};

export type SimulatorComputedResult = {
  clientType: ClientType;
  heightM: number;
  surfaceM2: number;
  heatingMode: HeatingMode;
  model: DestratModel;
  consigne: string | null;
  volumeM3: number;
  airChangeRate: number;
  modelCapacityM3h: number;
  neededDestrat: number;
  powerKw: number;
  consumptionKwhYear: number;
  costYearMin: number;
  costYearMax: number;
  costYearSelected: number;
  /** kWh/an économisés (hypothèse déstrat : part variable selon la hauteur, pas un fixe 30 %). */
  savingKwh30: number;
  savingEur30Min: number;
  savingEur30Max: number;
  savingEur30Selected: number;
  co2SavedTons: number;
  ceePrimeEstimated: number;
  installUnitPrice: number;
  installTotalPrice: number;
  restToCharge: number;
  leadScore: number;
  ceeSolution: CeeSolutionDecision;
  /** Présent lorsque `ceeSolution.solution === "PAC"` : estimation théorique air/eau (moteur dédié). */
  pacSavings?: PacSavingsResult | null;
};

export type LeadSimulationSnapshot = {
  version: string;
  simulatedAtIso: string;
  input: SimulatorInput;
  normalizedInput: {
    clientType: ClientType;
    heightM: number;
    surfaceM2: number;
    heatingMode: HeatingMode;
    model: DestratModel;
    consigne: string | null;
    /** Rappel champs CEE pour affichage / audit */
    isHeated: boolean;
    isClosed: boolean;
    buildingType: CeeBuildingType;
    localUsage: LocalUsageId;
    setpointTemp: number;
    heatingType: CeeHeatingKind;
    currentHeatingMode?: DestratCurrentHeatingModeId | null;
    need: CeeNeed;
    buildingAgeMoreThan2Years: boolean;
  };
  result: SimulatorComputedResult;
};
