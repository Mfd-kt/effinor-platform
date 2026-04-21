/**
 * Statuts d’appel qui clôturent l’assignation et retirent la fiche de « Ma file ».
 * Aligné sur les presets UI + saisies libres exactes (évite les faux positifs).
 */

export type TerminalCallOutcome = "out_of_target" | "cancelled";

/** Refus, annulation, numéro invalide, etc. → outcome `cancelled`. */
const CANCELLED_NORMALIZED = new Set([
  "refus",
  "refuse",
  "refuser",
  "annule",
  "annuler",
  "repondeur",
  "pas de reponse",
  "mauvais numero",
  "numero invalide",
  "numero incorrect",
  "faux numero",
  "numero non attribue",
  "numero indisponible",
]);

/** Hors cible → outcome `out_of_target`. */
const OUT_OF_TARGET_NORMALIZED = new Set(["hors cible", "hors-cible"]);

function normalizeForMatch(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .replace(/[.…]+$/u, "");
}

/**
 * Retourne l’outcome SQL si ce statut doit libérer la file agent, sinon null.
 * « Ciblé », « À rappeler », « Autre » : pas de clôture (la fiche reste en file).
 */
export function terminalOutcomeFromResolvedCallStatus(resolved: string | null): TerminalCallOutcome | null {
  if (!resolved) {
    return null;
  }
  const n = normalizeForMatch(resolved);
  if (!n) {
    return null;
  }
  if (OUT_OF_TARGET_NORMALIZED.has(n)) {
    return "out_of_target";
  }
  if (CANCELLED_NORMALIZED.has(n)) {
    return "cancelled";
  }
  return null;
}
