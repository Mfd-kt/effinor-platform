import { enrichLeadGenerationStockBatch } from "../enrichment/enrich-lead-generation-stock";
import { evaluateLeadGenerationDispatchQueueBatch } from "../queue/evaluate-dispatch-queue";
import { getLeadGenerationStockIdsByImportBatch } from "../queries/get-lead-generation-stock-ids-by-import-batch";
import { getLeadGenerationStockIdsNeedingContactImprovementForBatch } from "../queries/get-lead-generation-stock-ids-needing-contact-improvement-for-batch";
import { recalculateLeadGenerationCommercialScoreBatch } from "../scoring/recalculate-lead-generation-commercial-score-batch";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";

const SCORE_CHUNK = 100;
const DISPATCH_EVAL_CHUNK = 100;

/**
 * Variante « lot coordinateur » de la préparation cockpit : complète les contacts, score et file.
 */
export async function prepareLeadGenerationLot(coordinatorBatchId: string): Promise<{
  improvement_succeeded: number;
  improvement_attempted: number;
  total_scored: number;
  ready_now_in_lot: number;
  enrich_first_in_lot: number;
}> {
  const { settings } = await getLeadGenerationSettings();
  const limit = Math.min(100, Math.max(1, settings.mainActionsDefaults.prepare_batch_limit));
  const enrichCap = Math.min(50, limit);

  let improvement_succeeded = 0;
  let improvement_attempted = 0;

  const improveIds = await getLeadGenerationStockIdsNeedingContactImprovementForBatch(coordinatorBatchId, enrichCap);
  if (improveIds.length > 0) {
    const enriched = await enrichLeadGenerationStockBatch(improveIds);
    improvement_attempted = enriched.processed;
    improvement_succeeded = enriched.successes;
  }

  const lotIds = await getLeadGenerationStockIdsByImportBatch(coordinatorBatchId);
  let total_scored = 0;
  for (let i = 0; i < lotIds.length; i += SCORE_CHUNK) {
    const chunk = lotIds.slice(i, i + SCORE_CHUNK);
    const scored = await recalculateLeadGenerationCommercialScoreBatch(chunk);
    total_scored += scored.totalScored;
  }

  let ready_now_in_lot = 0;
  let enrich_first_in_lot = 0;
  for (let i = 0; i < lotIds.length; i += DISPATCH_EVAL_CHUNK) {
    const chunk = lotIds.slice(i, i + DISPATCH_EVAL_CHUNK);
    const q = await evaluateLeadGenerationDispatchQueueBatch(chunk);
    ready_now_in_lot += q.dispatchReadyNowCount;
    enrich_first_in_lot += q.dispatchEnrichFirstCount;
  }

  return {
    improvement_succeeded,
    improvement_attempted,
    total_scored,
    ready_now_in_lot,
    enrich_first_in_lot,
  };
}
