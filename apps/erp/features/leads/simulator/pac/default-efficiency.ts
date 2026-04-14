import type { HeatingSystemType } from "@/features/leads/simulator/pac/types";

/** Hypothèses de rendement annuel du générateur / distribution (valeurs prudentes, usage commercial). */
const DEFAULT_EFFICIENCY_BY_SYSTEM: Record<HeatingSystemType, number> = {
  chaudiere_gaz_classique: 0.82,
  chaudiere_gaz_condensation: 0.94,
  chaudiere_fioul: 0.8,
  chauffage_electrique_direct: 1.0,
  aerotherme_gaz: 0.85,
  aerotherme_electrique: 1.0,
  rooftop_cta_air_chaud: 0.83,
  radiant_gaz: 0.9,
  reseau_eau_chaude: 0.88,
  autre: 0.85,
};

export function getDefaultCurrentEfficiency(system: HeatingSystemType): number {
  return DEFAULT_EFFICIENCY_BY_SYSTEM[system];
}

/**
 * Rendement effectif : `customCurrentEfficiency` si fourni et valide, sinon défaut métier.
 * La validité stricte (> 0, ≤ 1.2) est appliquée dans `validatePacProjectInput`.
 */
export function resolveCurrentEfficiency(
  system: HeatingSystemType,
  customCurrentEfficiency: number | null | undefined,
): number {
  if (
    customCurrentEfficiency != null &&
    Number.isFinite(customCurrentEfficiency)
  ) {
    return customCurrentEfficiency;
  }
  return getDefaultCurrentEfficiency(system);
}
