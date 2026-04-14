import type { TechnicalVisitStatus } from "@/types/database.types";

/** Créneaux horaires proposés pour le planning VT (valeur stockée en `time_slot`). */
export const TECHNICAL_VISIT_TIME_SLOT_OPTIONS = [
  { value: "09-11", label: "09h – 11h" },
  { value: "11 - 13", label: "11h – 13h" },
  { value: "14-16", label: "14h – 16h" },
  { value: "16-18", label: "16h – 18h" },
] as const;

export const TECHNICAL_VISIT_STATUS_LABELS: Record<TechnicalVisitStatus, string> = {
  to_schedule: "À planifier",
  scheduled: "Planifiée",
  performed: "Effectuée",
  report_pending: "Rapport à compléter",
  validated: "Validée",
  refused: "Refusée",
  cancelled: "Annulée",
};
