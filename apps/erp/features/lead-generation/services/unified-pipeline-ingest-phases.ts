import type { RunGoogleMapsApifyImportInput } from "../apify/types";
import { startGoogleMapsApifyImport } from "../apify/start-google-maps-apify-import";
import { syncGoogleMapsApifyImport } from "../apify/sync-google-maps-apify-import";
import { isEligibleForVerifiedLeadGenerationEnrichment } from "../enrichment/verified-enrichment-eligibility";
import { extractVerifiedLeadGenerationEnrichment } from "../firecrawl/extract-verified-enrichment";
import { getLeadGenerationImportBatchById } from "../queries/get-lead-generation-import-batch-by-id";
import { getLeadGenerationStockFirecrawlCandidatesForBatch } from "../queries/get-lead-generation-stock-firecrawl-candidates-for-batch";
import { getLeadGenerationStockIdsByImportBatch } from "../queries/get-lead-generation-stock-ids-by-import-batch";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";
import { recalculateLeadGenerationCommercialScoreBatch } from "../scoring/recalculate-lead-generation-commercial-score-batch";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const POLL_MS = 3000;

const DEFAULT_UNIFIED_APIFY_WAIT_MS = 600_000;

function unifiedPipelineApifyWaitMs(): number {
  const raw = process.env.LEAD_GENERATION_UNIFIED_APIFY_WAIT_MS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 0;
  if (Number.isFinite(n) && n >= 120_000 && n <= 1_800_000) {
    return n;
  }
  return DEFAULT_UNIFIED_APIFY_WAIT_MS;
}

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
  /** Identifiant du lot (batch Google Maps) — alias historique « coordinateur ». */
  coordinatorBatchId: string;
  mapsBatchId: string;
  acceptedCount: number;
};

/**
 * Lance un import Google Maps Apify et attend la fin du run + ingestion SQL sur le même batch.
 */
export async function executeUnifiedMapsPhase(input: RunGoogleMapsApifyImportInput): Promise<MapsPhaseResult> {
  const launch = await startGoogleMapsApifyImport(input);
  if (!launch.ok) {
    throw new Error(launch.error);
  }

  const mapsBatchId = launch.data.batchId;
  const mapsWaitMs = unifiedPipelineApifyWaitMs();
  const deadline = Date.now() + mapsWaitMs;

  let last = await syncGoogleMapsApifyImport({ batchId: mapsBatchId });

  while (Date.now() < deadline) {
    if (last.phase === "completed" || last.phase === "already_completed") {
      break;
    }
    if (
      last.phase !== "running" &&
      last.phase !== "ingesting_elsewhere"
    ) {
      throw new Error(last.message ?? last.error ?? "Synchronisation Google Maps en échec.");
    }
    await sleep(POLL_MS);
    last = await syncGoogleMapsApifyImport({ batchId: mapsBatchId });
  }

  if (last.phase !== "completed" && last.phase !== "already_completed") {
    const minWait = Math.round(mapsWaitMs / 60_000);
    throw new Error(
      `Délai dépassé (~${minWait} min) en attendant l’ingestion carte. ` +
        `Les gros scrapings Google Maps peuvent être lents : ouvrez Imports, synchronisez ce lot Maps, ou augmentez LEAD_GENERATION_UNIFIED_APIFY_WAIT_MS (ms) puis relancez.`,
    );
  }

  const row = await getLeadGenerationImportBatchById(mapsBatchId);
  const acceptedCount = row?.accepted_count ?? last.acceptedCount ?? 0;

  return { coordinatorBatchId: mapsBatchId, mapsBatchId, acceptedCount };
}

export type FirecrawlPhaseResult = {
  attempted: number;
  succeeded: number;
  /** Aucun candidat Firecrawl sur le lot après filtrage métier. */
  nothingToEnrich: boolean;
};

/**
 * Lecture bornée des sites publics (Firecrawl) sur le lot courant — complète email / site quand c’est faisable.
 */
export async function executeUnifiedFirecrawlPhase(importBatchId: string): Promise<FirecrawlPhaseResult> {
  const { settings } = await getLeadGenerationSettings();
  const cap = Math.min(
    100,
    Math.max(1, settings.mainActionsDefaults.post_import_enrich_limit),
  );
  const scanCap = Math.min(500, cap * 5);

  const candidates = await getLeadGenerationStockFirecrawlCandidatesForBatch(importBatchId, scanCap);
  const targetIds: string[] = [];
  for (const row of candidates) {
    const el = isEligibleForVerifiedLeadGenerationEnrichment(row);
    if (el.ok) {
      targetIds.push(row.id);
    }
    if (targetIds.length >= cap) {
      break;
    }
  }

  if (targetIds.length === 0) {
    return { attempted: 0, succeeded: 0, nothingToEnrich: true };
  }

  let succeeded = 0;
  for (const stockId of targetIds) {
    const res = await extractVerifiedLeadGenerationEnrichment({ stockId });
    if (res.status === "completed") {
      succeeded += 1;
    }
  }

  return {
    attempted: targetIds.length,
    succeeded,
    nothingToEnrich: false,
  };
}
