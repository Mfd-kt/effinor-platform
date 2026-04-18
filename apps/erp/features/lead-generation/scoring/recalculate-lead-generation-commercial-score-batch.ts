import { getReadyStockIdsForCommercialScoreQuick } from "../queries/get-ready-stock-ids-for-commercial-score-quick";
import { recalculateLeadGenerationCommercialScore } from "./recalculate-lead-generation-commercial-score";

export type RecalculateLeadGenerationCommercialScoreBatchSummary = {
  totalRequested: number;
  totalScored: number;
  totalFailed: number;
  failedStockIds: string[];
};

const BATCH_MAX = 100;

/**
 * Recalcule le score commercial pour une liste d’ids (boucle séquentielle, max 100).
 */
export async function recalculateLeadGenerationCommercialScoreBatch(
  stockIds: string[],
): Promise<RecalculateLeadGenerationCommercialScoreBatchSummary> {
  const capped = stockIds.slice(0, BATCH_MAX);
  const failedStockIds: string[] = [];
  let totalScored = 0;

  for (const stockId of capped) {
    try {
      await recalculateLeadGenerationCommercialScore(stockId);
      totalScored += 1;
    } catch {
      failedStockIds.push(stockId);
    }
  }

  return {
    totalRequested: capped.length,
    totalScored,
    totalFailed: failedStockIds.length,
    failedStockIds,
  };
}

/**
 * Quick : fiches `ready`, priorité aux jamais scorées, puis plus récentes.
 */
export async function recalculateReadyLeadGenerationCommercialScoreQuick(input: {
  limit: number;
}): Promise<RecalculateLeadGenerationCommercialScoreBatchSummary> {
  const ids = await getReadyStockIdsForCommercialScoreQuick(input.limit);
  if (ids.length === 0) {
    return { totalRequested: 0, totalScored: 0, totalFailed: 0, failedStockIds: [] };
  }
  return recalculateLeadGenerationCommercialScoreBatch(ids);
}
