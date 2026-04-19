import type { RunGoogleMapsApifyImportInput } from "../apify/types";
import { syncGoogleMapsApifyImport } from "../apify/sync-google-maps-apify-import";
import { startGoogleMapsApifyImport } from "../apify/start-google-maps-apify-import";
import { getLeadGenerationImportBatchById } from "../queries/get-lead-generation-import-batch-by-id";
import { getLeadGenerationStockIdsByImportBatch } from "../queries/get-lead-generation-stock-ids-by-import-batch";
import { recalculateLeadGenerationCommercialScoreBatch } from "../scoring/recalculate-lead-generation-commercial-score-batch";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const APIFY_WAIT_MS = 240_000;
const POLL_MS = 3000;

export type RunImportEnrichFullPipelineResult = {
  coordinatorBatchId: string;
  mapsBatchId: string;
  fusionAcceptedCount: number;
  commercialScoredTotal: number;
  linkedIn: {
    status: "skipped" | "completed" | "pending_sync";
    batchId?: string;
    targetCount?: number;
    stocksUpdated?: number;
    reason?: string;
    note?: string;
  };
  timedOutWaitingApify: boolean;
};

/**
 * Google Maps → synchronisation jusqu’à ingestion → scores commerciaux sur le lot.
 */
export async function runImportEnrichFullPipeline(
  input: RunGoogleMapsApifyImportInput,
): Promise<RunImportEnrichFullPipelineResult> {
  const launch = await startGoogleMapsApifyImport(input);
  if (!launch.ok) {
    throw new Error(launch.error);
  }

  const mapsBatchId = launch.data.batchId;
  const coordinatorBatchId = mapsBatchId;

  const base = {
    coordinatorBatchId,
    mapsBatchId,
    fusionAcceptedCount: 0,
    commercialScoredTotal: 0,
    linkedIn: { status: "skipped" as const, reason: "Non démarré." },
    timedOutWaitingApify: false,
  };

  const deadline = Date.now() + APIFY_WAIT_MS;
  let fusionAcceptedCount = 0;

  while (Date.now() < deadline) {
    const mapsRes = await syncGoogleMapsApifyImport({ batchId: mapsBatchId });
    if (mapsRes.phase === "completed" || mapsRes.phase === "already_completed") {
      fusionAcceptedCount = mapsRes.acceptedCount ?? 0;
      break;
    }
    if (mapsRes.phase !== "running" && mapsRes.phase !== "ingesting_elsewhere") {
      throw new Error(mapsRes.message ?? mapsRes.error ?? "Synchronisation Maps en échec.");
    }
    await sleep(POLL_MS);
  }

  const coordRow = await getLeadGenerationImportBatchById(coordinatorBatchId);
  if (coordRow?.status !== "completed") {
    return {
      ...base,
      timedOutWaitingApify: true,
      linkedIn: {
        status: "skipped",
        reason:
          "Les runs Apify n’ont pas fini dans le délai serveur — ouvrez Imports et cliquez « Synchroniser » sur le lot Maps.",
      },
    };
  }

  if (fusionAcceptedCount === 0) {
    fusionAcceptedCount = coordRow.accepted_count ?? 0;
  }

  const stockIds = await getLeadGenerationStockIdsByImportBatch(coordinatorBatchId);
  let commercialScoredTotal = 0;
  for (let i = 0; i < stockIds.length; i += 100) {
    const chunk = stockIds.slice(i, i + 100);
    const scored = await recalculateLeadGenerationCommercialScoreBatch(chunk);
    commercialScoredTotal += scored.totalScored;
  }

  return {
    ...base,
    fusionAcceptedCount,
    commercialScoredTotal,
    linkedIn: {
      status: "skipped",
      reason: "L’enrichissement LinkedIn automatisé via Apify n’est plus proposé.",
    },
    timedOutWaitingApify: false,
  };
}
