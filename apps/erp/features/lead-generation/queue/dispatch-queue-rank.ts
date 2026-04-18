import type { LeadGenerationDispatchQueueStatus } from "../domain/statuses";

/**
 * Rang entier pour tri DESC : même statut départagé par score commercial (0–100).
 * `ready_now` > `enrich_first` > `review` > `low_value` > `do_not_dispatch`.
 */
export function computeLeadGenerationDispatchQueueRank(
  status: LeadGenerationDispatchQueueStatus,
  commercialScore: number,
): number {
  const tier: Record<LeadGenerationDispatchQueueStatus, number> = {
    ready_now: 5_000_000,
    enrich_first: 4_000_000,
    review: 3_000_000,
    low_value: 2_000_000,
    do_not_dispatch: 0,
  };
  const s = Math.min(100, Math.max(0, Math.floor(commercialScore)));
  return tier[status] + s;
}
