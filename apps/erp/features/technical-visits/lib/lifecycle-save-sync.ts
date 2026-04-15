import type { TechnicalVisitStatus } from "@/types/database.types";

const PLANNING_STATUSES: ReadonlySet<TechnicalVisitStatus> = new Set([
  "scheduled",
  "to_schedule",
]);

/**
 * Si le statut enregistré passe à « planifiée » ou « à planifier » et qu’il change,
 * on efface les horodatages terrain pour éviter « Planifiée » + « Terminer la visite »
 * (état incohérent après liste déroulante ou correction manuelle).
 */
export function clearLifecycleTimestampsWhenStatusMovesToPlanning(
  patch: Record<string, unknown>,
  nextStatus: TechnicalVisitStatus | undefined,
  previousStatus: TechnicalVisitStatus | null | undefined,
): void {
  if (nextStatus === undefined || previousStatus == null) return;
  if (!PLANNING_STATUSES.has(nextStatus)) return;
  if (previousStatus === nextStatus) return;

  patch.started_at = null;
  patch.completed_at = null;
  patch.performed_at = null;
}
