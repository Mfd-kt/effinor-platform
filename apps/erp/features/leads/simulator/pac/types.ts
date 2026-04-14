export type HeatingSystemType =
  | "chaudiere_gaz_classique"
  | "chaudiere_gaz_condensation"
  | "chaudiere_fioul"
  | "chauffage_electrique_direct"
  | "aerotherme_gaz"
  | "aerotherme_electrique"
  | "rooftop_cta_air_chaud"
  | "radiant_gaz"
  | "reseau_eau_chaude"
  | "autre";

export type PacProjectInput = {
  surfaceM2: number;
  annualHeatingNeedKwhPerM2: number;
  currentHeatingSystem: HeatingSystemType;
  customCurrentEfficiency?: number | null;
  pacScop: number;
  currentEnergyPricePerKwh?: number | null;
  pacElectricPricePerKwh?: number | null;
};

export type PacSavingsResult = {
  annualUsefulHeatingNeedKwh: number;
  currentEfficiency: number;
  currentConsumptionKwh: number;
  pacConsumptionKwh: number;
  annualEnergySavingsKwh: number;
  annualEnergySavingsPercent: number;
  currentAnnualCost: number | null;
  pacAnnualCost: number | null;
  annualCostSavings: number | null;
  commercialMessage: string;
};

export type PacSavingsBand = "faible" | "moyen" | "fort" | "tres_fort";

export type PacValidationIssue = {
  field: string;
  message: string;
};
