import type { TechnicalVisitRow } from "@/features/technical-visits/types";

/** Visite démarrée sur le terrain et pas encore clôturée (completed_at). */
export function isTechnicalVisitInProgress(
  row: Pick<TechnicalVisitRow, "started_at" | "completed_at" | "status">,
): boolean {
  if (!row.started_at) return false;
  if (row.completed_at) return false;
  if (row.status === "cancelled") return false;
  return true;
}
