import type { LeadGenerationActivityOutcome } from "../domain/assignment-activity";

/** Correspondance statut d’appel (liste ou libre) → issue normalisée du journal (optionnel). */
const EXACT: Record<string, LeadGenerationActivityOutcome> = {
  "Hors cible": "out_of_target_after_review",
  "Numéro invalide": "called_wrong_number",
  "Pas de réponse": "called_no_answer",
  Répondeur: "called_no_answer",
  "Contact établi": "called_standard",
  Ciblé: "called_interested",
  Refus: "called_not_interested",
  Annulé: "called_not_interested",
  "RDV fixé": "called_callback_requested",
  "À rappeler": "called_callback_requested",
  Autre: "called_standard",
};

function normalizeForMatch(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

export function mapResolvedCallStatusToActivityOutcome(resolved: string | null): LeadGenerationActivityOutcome | null {
  if (!resolved) {
    return null;
  }
  const exact = EXACT[resolved.trim()];
  if (exact) {
    return exact;
  }
  const n = normalizeForMatch(resolved);
  if (!n) {
    return null;
  }
  if (n.includes("hors") && n.includes("cible")) {
    return "out_of_target_after_review";
  }
  if (n.includes("numero") && n.includes("invalide")) {
    return "called_wrong_number";
  }
  if (n.includes("mauvais") && n.includes("numero")) {
    return "called_wrong_number";
  }
  if (n.includes("numero") && n.includes("incorrect")) {
    return "called_wrong_number";
  }
  if (n.includes("repondeur")) {
    return "called_no_answer";
  }
  if (n.includes("pas") && n.includes("reponse")) {
    return "called_no_answer";
  }
  if (n.includes("rappel")) {
    return "called_callback_requested";
  }
  if (n.includes("rdv")) {
    return "called_callback_requested";
  }
  return null;
}
