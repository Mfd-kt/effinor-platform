/**
 * Zones climatiques CEE officielles (réglementation thermique française).
 * Référence : décret tertiaire & arrêtés CEE — chaque département est rattaché à
 * une zone H1 (froid), H2 (tempéré) ou H3 (méditerranéen / DOM-TOM).
 *
 * Utilisé pour filtrer le stock immobilier selon la cible CEE active
 * (cf. constantes dans `map-item.ts`).
 */

const ZONE_H1_DEPTS = [
  "01", "02", "03", "05", "08", "10", "14", "15", "19", "21", "23", "25", "27", "28",
  "38", "39", "42", "43", "45", "51", "52", "54", "55", "57", "58", "59", "60", "61",
  "62", "63", "67", "68", "69", "70", "71", "73", "74", "75", "76", "77", "78", "80",
  "87", "88", "89", "90", "91", "92", "93", "94", "95", "975",
] as const;

const ZONE_H2_DEPTS = [
  "04", "07", "09", "12", "16", "17", "18", "22", "24", "26", "29", "31", "32", "33",
  "35", "36", "37", "40", "41", "44", "46", "47", "48", "49", "50", "53", "56", "64",
  "65", "72", "79", "81", "82", "84", "85", "86",
] as const;

const ZONE_H3_DEPTS = [
  "06", "11", "13", "20", "30", "34", "66", "83",
  "971", "972", "973", "974", "976",
] as const;

export type ClimateZone = "H1" | "H2" | "H3" | "unknown";

/** Helper interne : `Array.includes` typé sans cast `any`. */
function listIncludes(list: readonly string[], value: string): boolean {
  return list.includes(value);
}

/**
 * Calcule la zone climatique CEE depuis un code postal français.
 *
 * - Métropole : 2 premiers chiffres = département (ex. `34000` → `34` → H3).
 * - DOM-TOM   : 3 premiers chiffres si commence par `97`/`98` (ex. `97400` → `974` → H3).
 *
 * @returns "H1" | "H2" | "H3" | "unknown" si non identifiable.
 */
export function computeClimateZone(postalCode: string | null | undefined): ClimateZone {
  if (!postalCode) return "unknown";

  const cleanCode = postalCode.replace(/\D/g, "");
  if (!cleanCode) return "unknown";

  const dept =
    cleanCode.startsWith("97") || cleanCode.startsWith("98")
      ? cleanCode.substring(0, 3)
      : cleanCode.substring(0, 2);

  if (listIncludes(ZONE_H1_DEPTS, dept)) return "H1";
  if (listIncludes(ZONE_H2_DEPTS, dept)) return "H2";
  if (listIncludes(ZONE_H3_DEPTS, dept)) return "H3";

  return "unknown";
}
