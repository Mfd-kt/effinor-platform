import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import { getYellowPagesActorId, resolveYellowPagesApifyInputProfile } from "../apify/client";
import type { RunYellowPagesApifyImportInput } from "../apify/types";
import { syncGoogleMapsApifyImport } from "../apify/sync-google-maps-apify-import";
import { startYellowPagesApifyImport } from "../apify/start-yellow-pages-apify-import";
import { syncYellowPagesApifyImport } from "../apify/sync-yellow-pages-apify-import";
import { lgTable } from "../lib/lg-db";
import { getLeadGenerationImportBatchById } from "../queries/get-lead-generation-import-batch-by-id";
import { getLeadGenerationStockIdsByImportBatch } from "../queries/get-lead-generation-stock-ids-by-import-batch";
import { recalculateLeadGenerationCommercialScoreBatch } from "../scoring/recalculate-lead-generation-commercial-score-batch";
import { applyYellowPagesDatasetToLot } from "./apply-yellow-pages-dataset-to-lot";
import { runMultiSourceLeadGeneration } from "./run-multi-source-lead-generation";
import { startLinkedInEnrichmentApifyImport } from "./start-linkedin-enrichment-apify-import";
import { syncLinkedInEnrichmentApifyImport } from "./sync-linkedin-enrichment-apify-import";
import {
  finalizeDeferredMultiSourceCoordinator,
  syncMultiSourceCoordinatorImport,
} from "./sync-multi-source-coordinator-import";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function childSyncDone(phase: string): boolean {
  return phase === "completed" || phase === "already_completed" || phase === "completed_deferred";
}

const POLL_MS = 3000;

/** Délai max par étape Apify (Maps / Pages Jaunes) dans le parcours unifié — 4 min était trop court pour gros lots. */
const DEFAULT_UNIFIED_APIFY_WAIT_MS = 600_000;

function unifiedPipelineApifyWaitMs(): number {
  const raw = process.env.LEAD_GENERATION_UNIFIED_APIFY_WAIT_MS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 0;
  if (Number.isFinite(n) && n >= 120_000 && n <= 1_800_000) {
    return n;
  }
  return DEFAULT_UNIFIED_APIFY_WAIT_MS;
}

const LINKEDIN_WAIT_MS = 180_000;

async function patchCoordinatorYellowChild(coordinatorBatchId: string, yellowPagesBatchId: string): Promise<void> {
  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const row = await getLeadGenerationImportBatchById(coordinatorBatchId);
  if (!row) return;
  const metaRoot =
    typeof row.metadata_json === "object" && row.metadata_json !== null && !Array.isArray(row.metadata_json)
      ? { ...(row.metadata_json as Record<string, unknown>) }
      : {};
  const prevMs =
    typeof metaRoot.multiSource === "object" && metaRoot.multiSource !== null && !Array.isArray(metaRoot.multiSource)
      ? { ...(metaRoot.multiSource as Record<string, unknown>) }
      : {};
  await batches
    .update({
      metadata_json: {
        ...metaRoot,
        multiSource: {
          ...prevMs,
          yellowPagesBatchId,
          ypSkipped: false,
        },
      } as unknown as Json,
    } as never)
    .eq("id", coordinatorBatchId);
}

export async function scoreCommercialForCoordinatorLot(coordinatorBatchId: string): Promise<number> {
  const ids = await getLeadGenerationStockIdsByImportBatch(coordinatorBatchId);
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

/**
 * Étape 1 : lancement multi-source et attente ingestion Maps + coordinateur (maps_ingested si PJ différée).
 */
export async function executeUnifiedMapsPhase(
  input: RunYellowPagesApifyImportInput,
  opts: { deferYellowPages: boolean },
): Promise<MapsPhaseResult> {
  const launch = await runMultiSourceLeadGeneration({
    ...input,
    deferYellowPages: opts.deferYellowPages,
  });
  if (!launch.ok) {
    throw new Error(launch.error);
  }

  const coordinatorBatchId = launch.data.coordinatorBatchId;
  const mapsBatchId = launch.data.mapsBatchId;
  const mapsWaitMs = unifiedPipelineApifyWaitMs();
  const deadline = Date.now() + mapsWaitMs;
  let lastCoord = await syncMultiSourceCoordinatorImport({ coordinatorBatchId });

  while (Date.now() < deadline) {
    const mapsRes = await syncGoogleMapsApifyImport({ batchId: mapsBatchId });
    if (
      !childSyncDone(mapsRes.phase) &&
      mapsRes.phase !== "running" &&
      mapsRes.phase !== "ingesting_elsewhere"
    ) {
      throw new Error(mapsRes.message ?? mapsRes.error ?? "Synchronisation Google Maps en échec.");
    }

    lastCoord = await syncMultiSourceCoordinatorImport({ coordinatorBatchId });
    if (lastCoord.phase === "failed") {
      throw new Error(lastCoord.message ?? lastCoord.error ?? "Fusion coordinateur en échec.");
    }
    if (opts.deferYellowPages && lastCoord.phase === "maps_ingested") {
      break;
    }
    if (!opts.deferYellowPages && (lastCoord.phase === "completed" || lastCoord.phase === "already_completed")) {
      break;
    }
    await sleep(POLL_MS);
  }

  if (opts.deferYellowPages && lastCoord.phase !== "maps_ingested") {
    const minWait = Math.round(mapsWaitMs / 60_000);
    throw new Error(
      `Délai dépassé (~${minWait} min) en attendant l’ingestion carte et la fusion du lot. ` +
        `Les gros scrapings Google Maps peuvent être lents : ouvrez Imports, synchronisez le batch Maps puis le coordinateur, ou augmentez LEAD_GENERATION_UNIFIED_APIFY_WAIT_MS (ms) puis relancez.`,
    );
  }
  if (!opts.deferYellowPages && lastCoord.phase !== "completed" && lastCoord.phase !== "already_completed") {
    throw new Error(
      "Délai dépassé en attendant la fusion du lot. Synchronisez les imports depuis la page Imports puis relancez.",
    );
  }

  const coordRow = await getLeadGenerationImportBatchById(coordinatorBatchId);
  const acceptedCount = coordRow?.accepted_count ?? lastCoord.acceptedCount ?? 0;

  return { coordinatorBatchId, mapsBatchId, acceptedCount };
}

export type YellowPhaseResult = { patchedCount: number; fetchedCount: number };

/**
 * Étape 2 : Pages Jaunes (lot coordinateur). `strict` : échec Apify / timeout / sync KO → bloque le pipeline.
 */
export async function executeUnifiedYellowPagesPhase(
  input: RunYellowPagesApifyImportInput,
  coordinatorBatchId: string,
  opts: {
    strict: boolean;
    onWarning: (w: string) => void;
  },
): Promise<YellowPhaseResult | { blocked: true; message: string }> {
  const ypActorId = getYellowPagesActorId();
  if (!ypActorId) {
    return opts.strict
      ? { blocked: true, message: "Pages Jaunes : actor non configuré (APIFY_YELLOW_PAGES_ACTOR_ID)." }
      : { patchedCount: 0, fetchedCount: 0 };
  }

  if (ypActorId && resolveYellowPagesApifyInputProfile(ypActorId) === "trudax_us") {
    opts.onWarning(
      "Annuaire : actor de type Pages Jaunes US — usage plutôt test ; pas une source principale FR.",
    );
  }

  await scoreCommercialForCoordinatorLot(coordinatorBatchId);

  const ypStart = await startYellowPagesApifyImport({
    ...input,
    multiSourceCoordinatorBatchId: coordinatorBatchId,
    multiSourceDeferIngest: true,
  });

  let patchedCount = 0;
  let fetchedCount = 0;

  if (!ypStart.ok) {
    if (opts.strict) {
      return { blocked: true, message: `Pages Jaunes : ${ypStart.error}` };
    }
    opts.onWarning(`Pages Jaunes : ${ypStart.error}`);
  } else {
    await patchCoordinatorYellowChild(coordinatorBatchId, ypStart.data.batchId);
    const ypDeadline = Date.now() + unifiedPipelineApifyWaitMs();
    let ypSyncResolved = false;

    while (Date.now() < ypDeadline) {
      const ypRes = await syncYellowPagesApifyImport({ batchId: ypStart.data.batchId });
      if (childSyncDone(ypRes.phase)) {
        const applied = await applyYellowPagesDatasetToLot({
          coordinatorBatchId,
          yellowPagesBatchId: ypStart.data.batchId,
        });
        patchedCount = applied.patchedCount;
        fetchedCount = ypRes.fetchedCount ?? 0;
        ypSyncResolved = true;
        if (fetchedCount === 0) {
          opts.onWarning("Pages Jaunes : dataset vide après run — vérifiez search, location et l’actor.");
        } else if (patchedCount === 0) {
          opts.onWarning(
            "Pages Jaunes : résultats présents mais aucune fiche du lot mise à jour (correspondance ou format).",
          );
        }
        break;
      }
      if (ypRes.phase !== "running" && ypRes.phase !== "ingesting_elsewhere") {
        const msg = ypRes.message ?? ypRes.error ?? "synchronisation interrompue.";
        if (opts.strict) {
          return { blocked: true, message: `Pages Jaunes : ${msg}` };
        }
        opts.onWarning(`Pages Jaunes : ${msg}`);
        ypSyncResolved = true;
        break;
      }
      await sleep(POLL_MS);
    }

    if (!ypSyncResolved) {
      const msg =
        "Pages Jaunes : délai dépassé — la synchronisation n’est pas terminée. Reprenez depuis Imports puis relancez.";
      if (opts.strict) {
        return { blocked: true, message: msg };
      }
      opts.onWarning(msg);
    }
  }

  await finalizeDeferredMultiSourceCoordinator(coordinatorBatchId);
  await scoreCommercialForCoordinatorLot(coordinatorBatchId);

  return { patchedCount, fetchedCount };
}

export type LinkedInPhaseResult = { updatedCount: number };

/**
 * Étape 3 : LinkedIn ciblé sur le lot. `strict` : run en échec ou timeout → bloque.
 */
export async function executeUnifiedLinkedInPhase(
  coordinatorBatchId: string,
  opts: {
    strict: boolean;
    onWarning: (w: string) => void;
  },
): Promise<LinkedInPhaseResult | { blocked: true; message: string }> {
  const liStart = await startLinkedInEnrichmentApifyImport({ importBatchId: coordinatorBatchId });
  if (!liStart.ok) {
    if (liStart.skipped) {
      opts.onWarning(`LinkedIn : ${liStart.error}`);
      return { updatedCount: 0 };
    }
    return opts.strict
      ? { blocked: true, message: `LinkedIn : ${liStart.error}` }
      : (opts.onWarning(`LinkedIn : ${liStart.error}`), { updatedCount: 0 });
  }

  const liDeadline = Date.now() + LINKEDIN_WAIT_MS;
  let lastLi = await syncLinkedInEnrichmentApifyImport({ batchId: liStart.data.batchId });

  while (Date.now() < liDeadline) {
    if (lastLi.phase === "completed" || lastLi.phase === "already_completed") {
      const updatedCount = lastLi.acceptedCount ?? 0;
      const fetched = lastLi.fetchedCount ?? 0;
      if (fetched === 0) {
        opts.onWarning("LinkedIn : dataset vide — vérifiez proxy, cibles et schéma d’entrée de l’actor.");
      } else if (updatedCount === 0) {
        opts.onWarning("LinkedIn : profils renvoyés mais aucune fiche du lot mise en correspondance.");
      }
      return { updatedCount };
    }
    if (lastLi.phase === "failed" || lastLi.phase === "batch_failed" || lastLi.phase === "invalid_batch") {
      const msg = lastLi.message ?? lastLi.error ?? "échec du run ou du batch.";
      return opts.strict ? { blocked: true, message: `LinkedIn : ${msg}` } : (opts.onWarning(`LinkedIn : ${msg}`), { updatedCount: 0 });
    }
    if (lastLi.phase !== "running" && lastLi.phase !== "ingesting_elsewhere") {
      const msg = lastLi.message ?? lastLi.error ?? "état inattendu du batch.";
      return opts.strict ? { blocked: true, message: `LinkedIn : ${msg}` } : (opts.onWarning(`LinkedIn : ${msg}`), { updatedCount: 0 });
    }
    await sleep(POLL_MS);
    lastLi = await syncLinkedInEnrichmentApifyImport({ batchId: liStart.data.batchId });
  }

  const msg =
    "LinkedIn : délai dépassé — le run continue côté Apify. Synchronisez le batch LinkedIn depuis Imports puis relancez le parcours.";
  if (opts.strict) {
    return { blocked: true, message: msg };
  }
  opts.onWarning(msg);
  return { updatedCount: 0 };
}
