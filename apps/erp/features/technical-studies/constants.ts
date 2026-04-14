import type { StudyType, TechnicalStudyStatus } from "@/types/database.types";

export const STUDY_TYPE_LABELS: Record<StudyType, string> = {
  dimensioning_note: "Note de dimensionnement (NDD)",
  lighting_study: "Étude d’éclairage",
  technical_assessment: "Évaluation technique",
  cold_recovery_study: "Étude récupération froid",
  other: "Autre étude",
};

export const TECHNICAL_STUDY_STATUS_LABELS: Record<TechnicalStudyStatus, string> = {
  draft: "Brouillon",
  in_review: "En validation",
  approved: "Validée",
  rejected: "Refusée",
  archived: "Archivée",
};
