import type { TechnicalVisitStatus } from "@/types/database.types";

/**
 * Statuts VT considérés comme « actifs » pour le garde-fou « une VT par lead »
 * (refus / annulation permettent d’en recréer une).
 */
export const ACTIVE_TECHNICAL_VISIT_STATUSES: readonly TechnicalVisitStatus[] = [
  "to_schedule",
  "scheduled",
  "performed",
  "report_pending",
  "validated",
];
