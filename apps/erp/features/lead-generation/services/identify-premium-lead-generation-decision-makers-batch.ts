import { enrichLeadGenerationDecisionMaker } from "../enrichment/enrich-lead-generation-decision-maker";
import { getLeadGenerationStockIdsForPremiumDecisionMakerBatch } from "../queries/get-lead-generation-stock-ids-for-premium-decision-maker-batch";

export type IdentifyPremiumLeadGenerationDecisionMakersBatchSummary = {
  totalRequested: number;
  totalProcessed: number;
  totalSkipped: number;
  totalIdentified: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  failedStockIds: string[];
};

export async function identifyPremiumLeadGenerationDecisionMakersBatch(input?: {
  limit?: number;
}): Promise<IdentifyPremiumLeadGenerationDecisionMakersBatchSummary> {
  const ids = await getLeadGenerationStockIdsForPremiumDecisionMakerBatch({ limit: input?.limit });

  let totalSkipped = 0;
  let totalIdentified = 0;
  let highConfidenceCount = 0;
  let mediumConfidenceCount = 0;
  const failedStockIds: string[] = [];

  for (const stockId of ids) {
    const res = await enrichLeadGenerationDecisionMaker({ stockId });

    if (res.status === "failed") {
      failedStockIds.push(stockId);
      continue;
    }

    if (res.skipped) {
      totalSkipped += 1;
      continue;
    }

    if (res.decision_maker_name?.trim()) {
      totalIdentified += 1;
    }

    if (res.decision_maker_confidence === "high") {
      highConfidenceCount += 1;
    } else if (res.decision_maker_confidence === "medium") {
      mediumConfidenceCount += 1;
    }
  }

  return {
    totalRequested: ids.length,
    totalProcessed: ids.length,
    totalSkipped,
    totalIdentified,
    highConfidenceCount,
    mediumConfidenceCount,
    failedStockIds,
  };
}
