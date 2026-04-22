// TODO: simulator retiré — `DestratModel` provenait de features/leads/simulator.
// Codes catalogue conservés ici en attendant le nouveau module simulation.

const MODEL_PRODUCT_CODE: Record<string, string> = {
  teddington_ds3: "teddington_ds3",
  teddington_ds7: "teddington_ds7",
  generfeu: "generfeu",
};

export function getRecommendedProductCodes(
  _model: any,
): { primary: string; alternatives: string[] } {
  const all = Object.values(MODEL_PRODUCT_CODE);
  const primary = all[0] ?? "";
  const alternatives = all.slice(1);
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
