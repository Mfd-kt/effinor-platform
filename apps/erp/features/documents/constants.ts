import type { DocumentStatus, DocumentType } from "@/types/database.types";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  quote: "Devis",
  invoice: "Facture",
  delegate_invoice: "Facture délégataire",
  technical_study: "Étude technique",
  dimensioning_note: "Note de dimensionnement",
  cee_declaration: "Déclaration CEE",
  photo: "Photo",
  contract: "Contrat",
  proof: "Justificatif",
  correspondence: "Correspondance",
  other: "Autre",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Brouillon",
  pending_review: "En validation",
  valid: "Valide",
  rejected: "Refusé",
  superseded: "Remplacé",
};
