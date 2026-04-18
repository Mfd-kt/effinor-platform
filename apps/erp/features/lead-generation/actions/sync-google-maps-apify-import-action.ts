"use server";

import { syncGoogleMapsApifyImport } from "../apify/sync-google-maps-apify-import";
import { syncYellowPagesApifyImport } from "../apify/sync-yellow-pages-apify-import";
import type { SyncGoogleMapsApifyImportResult } from "../apify/types";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { getLeadGenerationImportBatchById } from "../queries/get-lead-generation-import-batch-by-id";
import { syncGoogleMapsApifyImportActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { syncLinkedInEnrichmentApifyImport } from "../services/sync-linkedin-enrichment-apify-import";
import { syncMultiSourceCoordinatorImport } from "../services/sync-multi-source-coordinator-import";

function coordinatorToSyncPayload(
  r: Awaited<ReturnType<typeof syncMultiSourceCoordinatorImport>>,
): SyncGoogleMapsApifyImportResult {
  const phase =
    r.phase === "completed"
      ? "completed"
      : r.phase === "already_completed"
        ? "already_completed"
        : r.phase === "running" || r.phase === "maps_ingested"
          ? "running"
          : "failed";
  return {
    phase,
    batchId: r.coordinatorBatchId,
    message: r.message,
    error: r.error,
    ingestedCount: r.mergedRowCount ?? r.ingestedCount,
    acceptedCount: r.acceptedCount,
  };
}

export async function syncGoogleMapsApifyImportAction(
  input: unknown,
): Promise<LeadGenerationActionResult<SyncGoogleMapsApifyImportResult>> {
  const parsed = syncGoogleMapsApifyImportActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Identifiant batch invalide." };
  }

  try {
    const batchId = parsed.data.batchId;
    const row = await getLeadGenerationImportBatchById(batchId);
    if (!row) {
      return { ok: false, error: "Batch introuvable." };
    }

    if (row.source === "apify_yellow_pages") {
      const data = await syncYellowPagesApifyImport({ batchId });
      return { ok: true, data };
    }
    if (row.source === "apify_linkedin_enrichment") {
      const data = await syncLinkedInEnrichmentApifyImport({ batchId });
      return { ok: true, data };
    }
    if (row.source === "apify_multi_source") {
      const r = await syncMultiSourceCoordinatorImport({ coordinatorBatchId: batchId });
      return { ok: true, data: coordinatorToSyncPayload(r) };
    }

    const data = await syncGoogleMapsApifyImport(parsed.data);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de la synchronisation import Apify.";
    return { ok: false, error: message };
  }
}
