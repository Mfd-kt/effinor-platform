/**
 * Zone climatique RT (H1 / H2 / H3) à partir du code postal travaux,
 * aligné sur la formule Airtable (départements DOM 97x/98x en 3 chiffres).
 */

function stripNonDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Listes exactes issues de la formule Airtable (FIND sur codes numériques). */
const H1_DEPTS = new Set([
  1, 2, 3, 5, 8, 10, 14, 15, 19, 21, 23, 25, 27, 28, 38, 39, 42, 43, 45, 51, 52, 54, 55, 57, 58,
  59, 60, 61, 62, 63, 67, 68, 69, 70, 71, 73, 74, 75, 76, 77, 78, 80, 87, 88, 89, 90, 91, 92, 93,
  94, 95, 975,
]);

const H2_DEPTS = new Set([
  4, 7, 9, 12, 16, 17, 18, 22, 24, 26, 29, 31, 32, 33, 35, 36, 37, 40, 41, 44, 46, 47, 48, 49, 50,
  53, 56, 64, 65, 72, 79, 81, 82, 84, 85, 86,
]);

const H3_DEPTS = new Set([6, 11, 13, 20, 30, 34, 66, 83, 971, 972, 973, 974, 976]);

/**
 * Extrait le « code département » comme dans Airtable :
 * - 97 / 98 → 3 premiers chiffres (971, 972, …)
 * - sinon → 2 premiers chiffres, interprétés en nombre (01 → 1)
 */
function deptKeyFromPostalDigits(digits: string): number | null {
  if (digits.length < 2) {
    return null;
  }
  const d2 = digits.slice(0, 2);
  if (d2 === "97" || d2 === "98") {
    if (digits.length >= 3) {
      return parseInt(digits.slice(0, 3), 10);
    }
    return null;
  }
  return parseInt(digits.slice(0, 2), 10);
}

export function climateZoneFromFrenchPostalCode(raw: string | null | undefined): string | undefined {
  if (raw == null) {
    return undefined;
  }
  const digits = stripNonDigits(raw);
  if (digits.length < 2) {
    return undefined;
  }
  const key = deptKeyFromPostalDigits(digits);
  if (key === null || Number.isNaN(key)) {
    return undefined;
  }
  if (H1_DEPTS.has(key)) {
    return "H1";
  }
  if (H2_DEPTS.has(key)) {
    return "H2";
  }
  if (H3_DEPTS.has(key)) {
    return "H3";
  }
  return "Zone inconnue";
}

/** CP travaux en priorité, puis siège (même logique que la région). */
export function climateZoneFromWorksiteOrHeadOfficePostalCode(
  worksitePostal: string | null | undefined,
  headOfficePostal: string | null | undefined,
): string | undefined {
  const fromWorksite = climateZoneFromFrenchPostalCode(worksitePostal);
  if (fromWorksite !== undefined) {
    return fromWorksite;
  }
  return climateZoneFromFrenchPostalCode(headOfficePostal);
}
