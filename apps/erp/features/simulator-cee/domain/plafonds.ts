import type { TrancheRevenu, ZoneKind } from "@/features/simulator-cee/domain/types";

/** Départements Île-de-France pour la zone « IDF ». */
export const IDF_DEPTS = ["75", "77", "78", "91", "92", "93", "94", "95"] as const;

export const CATEGORIES: Record<TrancheRevenu, string> = {
  tres_modeste: "Très modestes",
  modeste: "Modestes",
  intermediaire: "Intermédiaires",
  superieur: "Supérieurs",
};

/**
 * Plafonds de revenus fiscaux de référence (€ / an) par taille de foyer.
 * Chiffres indicatifs 2026 (métropole / IDF) — à recaler sur les barèmes ANAH / opérateurs.
 */
const INCOME_IDF: Record<number, { tres_modeste: number; modeste: number; intermediaire: number }> =
  {
    1: { tres_modeste: 24_393, modeste: 29_148, intermediaire: 38_184 },
    2: { tres_modeste: 35_822, modeste: 42_848, intermediaire: 56_014 },
    3: { tres_modeste: 43_061, modeste: 51_592, intermediaire: 67_550 },
    4: { tres_modeste: 50_287, modeste: 60_292, intermediaire: 78_835 },
    5: { tres_modeste: 57_549, modeste: 69_022, intermediaire: 90_411 },
    6: { tres_modeste: 64_825, modeste: 77_778, intermediaire: 102_007 },
  };

const INCOME_HORS_IDF: Record<number, { tres_modeste: number; modeste: number; intermediaire: number }> =
  {
    1: { tres_modeste: 22_461, modeste: 27_443, intermediaire: 35_052 },
    2: { tres_modeste: 32_981, modeste: 40_372, intermediaire: 51_481 },
    3: { tres_modeste: 39_742, modeste: 48_662, intermediaire: 62_007 },
    4: { tres_modeste: 46_491, modeste: 56_916, intermediaire: 72_377 },
    5: { tres_modeste: 53_267, modeste: 65_196, intermediaire: 82_823 },
    6: { tres_modeste: 60_057, modeste: 73_491, intermediaire: 93_287 },
  };

function clampPersons(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > 6) return 6;
  return Math.floor(n);
}

export function getThresholds(zone: ZoneKind, nbPersonnes: number) {
  const p = clampPersons(nbPersonnes);
  const table = zone === "idf" ? INCOME_IDF : INCOME_HORS_IDF;
  return table[p] ?? table[6]!;
}

/**
 * Plafonds d’aide CEE indicatifs (€ TTC cumulables) par zone, tranche et taille de foyer.
 * Structure requise par le spec — montants à valider.
 */
export const PLAFONDS: Record<
  Exclude<ZoneKind, "unknown">,
  Record<TrancheRevenu, Record<number, number>>
> = {
  idf: {
    tres_modeste: { 1: 18_000, 2: 22_000, 3: 26_000, 4: 30_000, 5: 34_000, 6: 38_000 },
    modeste: { 1: 14_000, 2: 18_000, 3: 21_000, 4: 24_000, 5: 27_000, 6: 30_000 },
    intermediaire: { 1: 9_000, 2: 12_000, 3: 14_000, 4: 16_000, 5: 18_000, 6: 20_000 },
    superieur: { 1: 4_000, 2: 5_500, 3: 6_500, 4: 7_500, 5: 8_500, 6: 9_500 },
  },
  hors_idf: {
    tres_modeste: { 1: 20_000, 2: 24_000, 3: 28_000, 4: 32_000, 5: 36_000, 6: 40_000 },
    modeste: { 1: 15_000, 2: 19_000, 3: 22_000, 4: 25_000, 5: 28_000, 6: 31_000 },
    intermediaire: { 1: 10_000, 2: 13_000, 3: 15_000, 4: 17_000, 5: 19_000, 6: 21_000 },
    superieur: { 1: 4_500, 2: 6_000, 3: 7_000, 4: 8_000, 5: 9_000, 6: 10_000 },
  },
};

export function getPlafondMax(zone: ZoneKind, tranche: TrancheRevenu, nbPersonnes: number): number {
  if (zone === "unknown") {
    return getPlafondMax("hors_idf", tranche, nbPersonnes);
  }
  const p = clampPersons(nbPersonnes);
  const z = zone === "idf" ? "idf" : "hors_idf";
  const row = PLAFONDS[z][tranche];
  return row[p] ?? row[6]!;
}

export type TrancheOption = {
  id: TrancheRevenu;
  label: string;
  hint: string;
};

/** Libellés + bornes pour le sélecteur de tranche (revenu fiscal de référence). */
export function buildTranches(zone: ZoneKind, nbPersonnes: number): TrancheOption[] {
  const t = getThresholds(zone, nbPersonnes);
  return [
    {
      id: "tres_modeste",
      label: CATEGORIES.tres_modeste,
      hint: `Jusqu’à ${t.tres_modeste.toLocaleString("fr-FR")} € / an (foyer)`,
    },
    {
      id: "modeste",
      label: CATEGORIES.modeste,
      hint: `De ${(t.tres_modeste + 1).toLocaleString("fr-FR")} à ${t.modeste.toLocaleString("fr-FR")} €`,
    },
    {
      id: "intermediaire",
      label: CATEGORIES.intermediaire,
      hint: `De ${(t.modeste + 1).toLocaleString("fr-FR")} à ${t.intermediaire.toLocaleString("fr-FR")} €`,
    },
    {
      id: "superieur",
      label: CATEGORIES.superieur,
      hint: `Au-delà de ${t.intermediaire.toLocaleString("fr-FR")} €`,
    },
  ];
}
