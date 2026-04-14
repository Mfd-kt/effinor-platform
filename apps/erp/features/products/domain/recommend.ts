import type { DestratModel } from "@/features/leads/simulator/domain/types";

const MODEL_PRODUCT_CODE: Record<DestratModel, string> = {
  teddington_ds3: "teddington_ds3",
  teddington_ds7: "teddington_ds7",
  generfeu: "generfeu",
};

export function getRecommendedProductCodes(
  model: DestratModel,
): { primary: string; alternatives: string[] } {
  const primary = MODEL_PRODUCT_CODE[model];
  const alternatives = Object.values(MODEL_PRODUCT_CODE).filter((c) => c !== primary);
  return { primary, alternatives };
}

export function allDestratProductCodes(): string[] {
  return Object.values(MODEL_PRODUCT_CODE);
}

/** Produit catalogue PAC affiché poste agent / confirmateur (aligné sur les seeds SQL). */
export const AGENT_PAC_CATALOG_PRODUCT_CODE = "bosch_pac_air_eau";

/** Catalogue chargé pour le quick simulateur agent (déstrat + PAC). */
export function allAgentQuickSimulatorProductCodes(): string[] {
  return [...allDestratProductCodes(), AGENT_PAC_CATALOG_PRODUCT_CODE];
}
