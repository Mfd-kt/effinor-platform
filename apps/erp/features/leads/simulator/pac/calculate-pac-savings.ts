import { buildCommercialMessage } from "@/features/leads/simulator/pac/build-commercial-message";
import { resolveCurrentEfficiency } from "@/features/leads/simulator/pac/default-efficiency";
import type { PacProjectInput, PacSavingsResult } from "@/features/leads/simulator/pac/types";
import { validatePacProjectInput } from "@/features/leads/simulator/pac/validate-pac-project-input";

function roundKwh(n: number): number {
  return Math.round(n);
}

/** Pourcentage affiché avec 1 décimale (arrondi “commercial”). */
function roundPercent1(n: number): number {
  return Math.round(n * 10) / 10;
}

function roundEur2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Moteur pur : besoin utile, consommations actuelle / PAC, économies kWh, % et € si prix fournis.
 */
export function calculatePacSavings(input: PacProjectInput): PacSavingsResult {
  validatePacProjectInput(input);

  const annualUsefulHeatingNeedKwhRaw = input.surfaceM2 * input.annualHeatingNeedKwhPerM2;
  const currentEfficiency = resolveCurrentEfficiency(input.currentHeatingSystem, input.customCurrentEfficiency);

  const currentConsumptionKwhRaw = annualUsefulHeatingNeedKwhRaw / currentEfficiency;
  const pacConsumptionKwhRaw = annualUsefulHeatingNeedKwhRaw / input.pacScop;

  const annualUsefulHeatingNeedKwh = roundKwh(annualUsefulHeatingNeedKwhRaw);
  const currentConsumptionKwh = roundKwh(currentConsumptionKwhRaw);
  const pacConsumptionKwh = roundKwh(pacConsumptionKwhRaw);
  /** Économie = écart des consommations déjà arrondies (lisible et aligné fiche commerciale). */
  const annualEnergySavingsKwh = currentConsumptionKwh - pacConsumptionKwh;
  const annualEnergySavingsPercentRaw =
    currentConsumptionKwh > 0 ? (annualEnergySavingsKwh / currentConsumptionKwh) * 100 : 0;
  const annualEnergySavingsPercent = roundPercent1(annualEnergySavingsPercentRaw);

  const hasCurrentPrice =
    input.currentEnergyPricePerKwh != null &&
    input.currentEnergyPricePerKwh !== undefined &&
    Number.isFinite(input.currentEnergyPricePerKwh);
  const hasPacPrice =
    input.pacElectricPricePerKwh != null &&
    input.pacElectricPricePerKwh !== undefined &&
    Number.isFinite(input.pacElectricPricePerKwh);

  let currentAnnualCost: number | null = null;
  let pacAnnualCost: number | null = null;
  let annualCostSavings: number | null = null;

  if (hasCurrentPrice && hasPacPrice) {
    /** Coûts basés sur les kWh arrondis (cohérent avec l’affichage kWh). */
    currentAnnualCost = roundEur2(currentConsumptionKwh * input.currentEnergyPricePerKwh!);
    pacAnnualCost = roundEur2(pacConsumptionKwh * input.pacElectricPricePerKwh!);
    annualCostSavings = roundEur2(currentAnnualCost - pacAnnualCost);
  }

  const result: PacSavingsResult = {
    annualUsefulHeatingNeedKwh,
    currentEfficiency,
    currentConsumptionKwh,
    pacConsumptionKwh,
    annualEnergySavingsKwh,
    annualEnergySavingsPercent,
    currentAnnualCost,
    pacAnnualCost,
    annualCostSavings,
    commercialMessage: "",
  };
  result.commercialMessage = buildCommercialMessage(result, input);
  return result;
}
