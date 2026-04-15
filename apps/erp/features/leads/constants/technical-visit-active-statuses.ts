import type { TechnicalVisitStatus } from "@/types/database.types";

/**
 * Statuts VT « en cours » : une seule VT dans cet ensemble par workflow (ou par lead
 * si workflow_id NULL), aligné sur les index uniques partiels en base.
 * Exclus : validated (cycle terminé — nouvelle VT possible), refused, cancelled.
 */
export const ACTIVE_TECHNICAL_VISIT_STATUSES: readonly TechnicalVisitStatus[] = [
  "to_schedule",
  "scheduled",
  "performed",
  "report_pending",
];
