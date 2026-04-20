import type { LeadGenerationDuplicateMatchReason } from "./compute-duplicate-match";

const LABELS_FR: Record<LeadGenerationDuplicateMatchReason, string> = {
  exact_siret: "SIRET identique",
  exact_email: "E-mail identique",
  exact_normalized_phone: "Téléphone normalisé identique",
  exact_normalized_company_name: "Raison sociale normalisée identique",
  exact_phone_and_similar_name: "Téléphone identique et raison sociale proche",
  exact_domain_and_similar_name: "Site web (domaine) identique et raison sociale proche",
  similar_name_same_city_and_postal: "Raison sociale proche, même ville et même code postal",
  similar_name_and_same_city: "Raison sociale proche et même ville",
  similar_name_and_same_postal: "Raison sociale proche et même code postal",
  auto_duplicate_of_out_of_target: "Doublon d’une fiche déjà hors cible (exclusion automatique)",
};

/** Libellés lisibles pour l’UI (codes issus de l’ingestion). */
export function formatDuplicateMatchReasonsForDisplay(reasons: string[] | null | undefined): string[] {
  if (!reasons?.length) {
    return [];
  }
  return reasons.map((r) => LABELS_FR[r as LeadGenerationDuplicateMatchReason] ?? r);
}
