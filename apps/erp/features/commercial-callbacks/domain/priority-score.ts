import { computeCommercialCallbackScore } from "@/features/commercial-callbacks/lib/callback-scoring";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

/** @deprecated Utiliser `computeCommercialCallbackScore` — conservé pour tri / affichage « Score ». */
export function computeCallbackPriorityScore(
  row: CommercialCallbackRow,
  now: Date = new Date(),
): number {
  return computeCommercialCallbackScore(row, now).businessScore;
}
