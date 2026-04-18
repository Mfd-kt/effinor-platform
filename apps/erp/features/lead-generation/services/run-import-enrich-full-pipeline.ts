import type { RunYellowPagesApifyImportInput } from "../apify/types";
import { syncGoogleMapsApifyImport } from "../apify/sync-google-maps-apify-import";
import { syncYellowPagesApifyImport } from "../apify/sync-yellow-pages-apify-import";
import { getLeadGenerationImportBatchById } from "../queries/get-lead-generation-import-batch-by-id";
import { getLeadGenerationStockIdsByImportBatch } from "../queries/get-lead-generation-stock-ids-by-import-batch";
import { recalculateLeadGenerationCommercialScoreBatch } from "../scoring/recalculate-lead-generation-commercial-score-batch";
import { runMultiSourceLeadGeneration } from "./run-multi-source-lead-generation";
import { startLinkedInEnrichmentApifyImport } from "./start-linkedin-enrichment-apify-import";
import { syncLinkedInEnrichmentApifyImport } from "./sync-linkedin-enrichment-apify-import";
import { syncMultiSourceCoordinatorImport } from "./sync-multi-source-coordinator-import";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function childSyncDone(phase: string): boolean {
  return phase === "completed" || phase === "already_completed" || phase === "completed_deferred";
}

const APIFY_WAIT_MS = 240_000;
const POLL_MS = 3000;
const LINKEDIN_WAIT_MS = 180_000;

export type RunImportEnrichFullPipelineResult = {
  coordinatorBatchId: string;
  mapsBatchId: string;
  yellowPagesBatchId: string | null;
  ypSkipped: boolean;
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
 * Un seul parcours côté serveur : multi-source (Maps + PJ si configuré) → sync enfants → fusion → scores commerciaux → LinkedIn (lancer + sync si Apify assez rapide).
 * Peut dépasser plusieurs minutes si les runs Apify sont longs (configurer `maxDuration` sur la route).
 */
export async function runImportEnrichFullPipeline(
  input: RunYellowPagesApifyImportInput,
): Promise<RunImportEnrichFullPipelineResult> {
  const launch = await runMultiSourceLeadGeneration(input);
  if (!launch.ok) {
    throw new Error(launch.error);
  }

  const { coordinatorBatchId, mapsBatchId, yellowPagesBatchId, ypSkipped } = launch.data;

  const base = {
    coordinatorBatchId,
    mapsBatchId,
    yellowPagesBatchId: yellowPagesBatchId ?? null,
    ypSkipped,
    fusionAcceptedCount: 0,
    commercialScoredTotal: 0,
    linkedIn: { status: "skipped" as const, reason: "Non démarré." },
    timedOutWaitingApify: false,
  };

  const deadline = Date.now() + APIFY_WAIT_MS;
  let fusionAcceptedCount = 0;

  while (Date.now() < deadline) {
    const mapsRes = await syncGoogleMapsApifyImport({ batchId: mapsBatchId });
    if (!childSyncDone(mapsRes.phase) && mapsRes.phase !== "running" && mapsRes.phase !== "ingesting_elsewhere") {
      throw new Error(mapsRes.message ?? mapsRes.error ?? "Synchronisation Maps en échec.");
    }

    if (!ypSkipped && yellowPagesBatchId) {
      const ypRes = await syncYellowPagesApifyImport({ batchId: yellowPagesBatchId });
      if (!childSyncDone(ypRes.phase) && ypRes.phase !== "running" && ypRes.phase !== "ingesting_elsewhere") {
        throw new Error(ypRes.message ?? ypRes.error ?? "Synchronisation Pages Jaunes en échec.");
      }
    }

    const coord = await syncMultiSourceCoordinatorImport({ coordinatorBatchId });
    if (coord.phase === "completed") {
      fusionAcceptedCount = coord.acceptedCount ?? 0;
      break;
    }
    if (coord.phase === "already_completed") {
      const row = await getLeadGenerationImportBatchById(coordinatorBatchId);
      fusionAcceptedCount = row?.accepted_count ?? coord.acceptedCount ?? 0;
      break;
    }
    if (coord.phase === "failed" || coord.phase === "invalid_batch") {
      throw new Error(coord.message ?? coord.error ?? "Fusion multi-source en échec.");
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
          "Les runs Apify n’ont pas fini dans le délai serveur — ouvrez Imports et cliquez « Synchroniser » sur Maps, Pages Jaunes puis le coordinateur, puis relancez un lot LinkedIn si besoin.",
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

  const liStart = await startLinkedInEnrichmentApifyImport();
  if (!liStart.ok) {
    return {
      ...base,
      fusionAcceptedCount,
      commercialScoredTotal,
      linkedIn: {
        status: "skipped",
        reason: liStart.skipped ? liStart.error : liStart.error,
      },
      timedOutWaitingApify: false,
    };
  }

  const liBatchId = liStart.data.batchId;
  const liDeadline = Date.now() + LINKEDIN_WAIT_MS;

  while (Date.now() < liDeadline) {
    const liSync = await syncLinkedInEnrichmentApifyImport({ batchId: liBatchId });
    if (liSync.phase === "completed" || liSync.phase === "already_completed") {
      return {
        ...base,
        fusionAcceptedCount,
        commercialScoredTotal,
        linkedIn: {
          status: "completed",
          batchId: liBatchId,
          targetCount: liStart.data.targetCount,
          stocksUpdated: liSync.acceptedCount,
        },
        timedOutWaitingApify: false,
      };
    }
    if (
      liSync.phase === "failed" ||
      liSync.phase === "batch_failed" ||
      liSync.phase === "invalid_batch"
    ) {
      return {
        ...base,
        fusionAcceptedCount,
        commercialScoredTotal,
        linkedIn: {
          status: "pending_sync",
          batchId: liBatchId,
          targetCount: liStart.data.targetCount,
          note: liSync.message ?? liSync.error,
        },
        timedOutWaitingApify: false,
      };
    }
    await sleep(POLL_MS);
  }

  return {
    ...base,
    fusionAcceptedCount,
    commercialScoredTotal,
    linkedIn: {
      status: "pending_sync",
      batchId: liBatchId,
      targetCount: liStart.data.targetCount,
      note:
        "Run LinkedIn encore en cours côté Apify — ouvrez Imports et synchronisez le batch LinkedIn une fois terminé.",
    },
    timedOutWaitingApify: false,
  };
}
