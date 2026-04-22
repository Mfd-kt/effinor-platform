import { getLeadGenerationStockIdsByImportBatch } from "../queries/get-lead-generation-stock-ids-by-import-batch";
import { recalculateLeadGenerationCommercialScoreBatch } from "../scoring/recalculate-lead-generation-commercial-score-batch";

export async function scoreCommercialForCoordinatorLot(importBatchId: string): Promise<number> {
  const ids = await getLeadGenerationStockIdsByImportBatch(importBatchId);
  let total = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const s = await recalculateLeadGenerationCommercialScoreBatch(chunk);
    total += s.totalScored;
  }
  return total;
}

export type MapsPhaseResult = {
  coordinatorBatchId: string;
  mapsBatchId: string;
  acceptedCount: number;
};

// TODO: Reimplement when a new external scraping integration replaces Apify Google Maps.
export async function executeUnifiedMapsPhase(_input: Record<string, unknown>): Promise<MapsPhaseResult> {
  throw new Error(
    "Phase carte indisponible : la nouvelle source d'acquisition (Pages Jaunes / Le Bon Coin) n'est pas encore branchée.",
  );
}

export type FirecrawlPhaseResult = {
  attempted: number;
  succeeded: number;
  nothingToEnrich: boolean;
};

// TODO: Reimplement when a new public-site verification source replaces Firecrawl.
export async function executeUnifiedFirecrawlPhase(_importBatchId: string): Promise<FirecrawlPhaseResult> {
  return { attempted: 0, succeeded: 0, nothingToEnrich: true };
}
