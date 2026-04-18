/**
 * Normalisation légère du nom de société (affichage + comparaison).
 * Évite les transformations destructrices (casse mixte, ponctuation métier).
 */

/** Trim + espaces internes fusionnés (affichage). */
export function trimCollapseCompanyName(input: string | null | undefined): string {
  return (input ?? "").trim().replace(/\s+/g, " ");
}

/**
 * Clé de déduplication : minuscules + espaces collapsés.
 * Ne modifie pas les accents (cohérent avec stockage SQL text).
 */
export function normalizeCompanyNameForDedup(input: string | null | undefined): string | null {
  const t = trimCollapseCompanyName(input);
  if (!t) {
    return null;
  }
  return t.toLowerCase();
}
