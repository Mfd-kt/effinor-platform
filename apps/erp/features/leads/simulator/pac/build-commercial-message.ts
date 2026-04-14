import type { PacProjectInput, PacSavingsResult } from "@/features/leads/simulator/pac/types";

const DISCLAIMER =
  " Estimation théorique basée sur les hypothèses de rendement du système existant et le SCOP estimé de la PAC.";

/**
 * Texte court pour argumentaire commercial (wording prudent, pas d’engagement absolu).
 */
export function buildCommercialMessage(result: PacSavingsResult, _input: PacProjectInput): string {
  const p = result.annualEnergySavingsPercent;
  let core: string;
  if (p >= 70) {
    core =
      "Le remplacement du chauffage actuel par une PAC présente un très fort potentiel d’économie d’énergie.";
  } else if (p >= 50) {
    core =
      "Le remplacement du chauffage actuel par une PAC présente un potentiel d’économie d’énergie important.";
  } else {
    core =
      "Le remplacement du chauffage actuel par une PAC présente un potentiel d’économie à confirmer par étude technique.";
  }
  return `${core}${DISCLAIMER}`;
}
