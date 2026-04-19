import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import type { LeadGenerationRawStockInput } from "../domain/raw-input";
import { lgTable } from "../lib/lg-db";
import { getLeadGenerationImportBatchById } from "../queries/get-lead-generation-import-batch-by-id";
import { ingestLeadGenerationStock } from "../services/ingest-lead-generation-stock";

import {
  buildApifyPartialDatasetRecoveryMetadata,
  APIFY_PARTIAL_IMPORT_META_KEY,
} from "../lib/apify-partial-dataset-recovery";
import { getApifyDatasetItems, getApifyEnv, getApifyRun, isApifyRunFinished } from "./client";
import { mapGoogleMapsApifyItem } from "./map-google-maps-item";
import type { SyncGoogleMapsApifyImportResult } from "./types";

function resolveExternalRunId(row: {
  external_run_id: string | null;
  job_reference: string | null;
}): string | null {
  const a = row.external_run_id?.trim();
  if (a) return a;
  const b = row.job_reference?.trim();
  return b || null;
}

async function updateBatchApifyFields(
  supabase: SupabaseClient,
  batchId: string,
  patch: {
    external_status?: string;
    external_dataset_id?: string | null;
    metadata_json?: Record<string, unknown>;
  },
): Promise<void> {
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const update: Record<string, unknown> = {};
  if (patch.external_status !== undefined) update.external_status = patch.external_status;
  if (patch.external_dataset_id !== undefined) update.external_dataset_id = patch.external_dataset_id;
  if (patch.metadata_json !== undefined) update.metadata_json = patch.metadata_json as unknown as Json;
  if (Object.keys(update).length === 0) return;
  await batches.update(update as never).eq("id", batchId);
}

/**
 * Relit l’état Apify, finalise l’ingestion une fois le run terminé (idempotent si déjà `completed`).
 */
export async function syncGoogleMapsApifyImport(input: {
  batchId: string;
  /** Resynchronisation explicite d’un lot déjà en `failed` (bouton « Retenter la synchro »). */
  retryFromFailed?: boolean;
}): Promise<SyncGoogleMapsApifyImportResult> {
  const { batchId, retryFromFailed } = input;

  let token: string;
  try {
    token = getApifyEnv().token;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Configuration Apify invalide.";
    return { phase: "invalid_batch", batchId, message, error: message };
  }

  const row = await getLeadGenerationImportBatchById(batchId);
  if (!row) {
    return { phase: "invalid_batch", batchId, message: "Batch introuvable." };
  }

  if (row.source !== "apify_google_maps") {
    return {
      phase: "invalid_batch",
      batchId,
      message: "Ce batch n’est pas un import apify_google_maps.",
    };
  }

  if (row.status === "completed") {
    return {
      phase: "already_completed",
      batchId,
      apifyRunId: row.external_run_id ?? row.job_reference ?? undefined,
      datasetId: row.external_dataset_id ?? undefined,
      externalStatus: row.external_status ?? "SUCCEEDED",
      fetchedCount: row.imported_count,
      ingestedCount: row.imported_count,
      acceptedCount: row.accepted_count,
      duplicateCount: row.duplicate_count,
      rejectedCount: row.rejected_count,
      message: "Déjà importé ; aucune nouvelle ingestion.",
    };
  }

  if (row.status === "failed" && !retryFromFailed) {
    return {
      phase: "batch_failed",
      batchId,
      apifyRunId: row.external_run_id ?? row.job_reference ?? undefined,
      datasetId: row.external_dataset_id ?? undefined,
      externalStatus: row.external_status ?? undefined,
      error: row.error_summary ?? undefined,
      message:
        "Batch en échec ; pas de nouvelle tentative automatique. Créez un nouvel import si besoin.",
    };
  }

  const runId = resolveExternalRunId(row);
  if (!runId) {
    return {
      phase: "invalid_batch",
      batchId,
      message: "Batch sans external_run_id (ni job_reference) : synchronisation impossible.",
    };
  }

  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");

  let run;
  try {
    run = await getApifyRun(token, runId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lecture run Apify.";
    return {
      phase: "failed",
      batchId,
      apifyRunId: runId,
      error: message,
      message,
    };
  }

  const datasetFromRun = run.defaultDatasetId ?? "";
  const metaBase =
    typeof row.metadata_json === "object" &&
    row.metadata_json !== null &&
    !Array.isArray(row.metadata_json)
      ? { ...(row.metadata_json as Record<string, unknown>) }
      : {};
  await updateBatchApifyFields(supabase, batchId, {
    external_status: run.status,
    external_dataset_id: datasetFromRun || row.external_dataset_id,
    metadata_json: {
      ...metaBase,
      last_apify_poll_at: new Date().toISOString(),
    },
  });

  const fin = isApifyRunFinished(run.status);
  if (fin === "running") {
    return {
      phase: "running",
      batchId,
      apifyRunId: runId,
      datasetId: datasetFromRun || row.external_dataset_id || undefined,
      externalStatus: run.status,
      message: "Run Apify encore en cours ; réessayez plus tard.",
    };
  }

  const datasetId = (datasetFromRun || row.external_dataset_id || "").trim();
  if (!datasetId) {
    const finishedAt = new Date().toISOString();
    if (fin === "fail") {
      const summary = `Run Apify terminé en échec (${run.status}) — aucun dataset.`;
      await batches
        .update({
          status: "failed",
          finished_at: finishedAt,
          external_status: run.status,
          error_summary: summary.slice(0, 2000),
        } as never)
        .eq("id", batchId);
      return {
        phase: "failed",
        batchId,
        apifyRunId: runId,
        datasetId: undefined,
        externalStatus: run.status,
        error: summary,
        message: summary,
      };
    }
    const msg = "Run Apify réussi mais aucun dataset disponible.";
    await batches
      .update({
        status: "failed",
        finished_at: finishedAt,
        external_status: run.status,
        error_summary: msg.slice(0, 2000),
      } as never)
      .eq("id", batchId);
    return {
      phase: "failed",
      batchId,
      apifyRunId: runId,
      externalStatus: run.status,
      error: msg,
      message: msg,
    };
  }

  let rawItems: unknown[];
  try {
    rawItems = await getApifyDatasetItems(token, datasetId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lecture dataset Apify.";
    return {
      phase: "failed",
      batchId,
      apifyRunId: runId,
      datasetId,
      externalStatus: run.status,
      error: message,
      message,
    };
  }

  if (fin === "fail" && rawItems.length === 0) {
    const finishedAt = new Date().toISOString();
    const summary = `Run Apify terminé en échec (${run.status}) — dataset vide.`;
    await batches
      .update({
        status: "failed",
        finished_at: finishedAt,
        external_status: run.status,
        error_summary: summary.slice(0, 2000),
      } as never)
      .eq("id", batchId);
    return {
      phase: "failed",
      batchId,
      apifyRunId: runId,
      datasetId,
      externalStatus: run.status,
      error: summary,
      message: summary,
    };
  }

  const partialRecoveryMeta =
    fin === "fail" && rawItems.length > 0
      ? buildApifyPartialDatasetRecoveryMetadata(run.status, rawItems.length, new Date().toISOString())
      : null;

  const now = new Date().toISOString();
  const { data: claimRows, error: claimErr } = await batches
    .update({ ingest_started_at: now } as never)
    .eq("id", batchId)
    .eq("status", "running")
    .is("ingest_started_at", null)
    .select("id");

  if (claimErr) {
    return {
      phase: "failed",
      batchId,
      apifyRunId: runId,
      datasetId,
      error: claimErr.message,
      message: claimErr.message,
    };
  }

  if (!claimRows || claimRows.length === 0) {
    const again = await getLeadGenerationImportBatchById(batchId);
    if (again?.status === "completed") {
      return {
        phase: "already_completed",
        batchId,
        apifyRunId: again.external_run_id ?? again.job_reference ?? undefined,
        datasetId: again.external_dataset_id ?? undefined,
        externalStatus: again.external_status ?? "SUCCEEDED",
        fetchedCount: again.imported_count,
        ingestedCount: again.imported_count,
        acceptedCount: again.accepted_count,
        duplicateCount: again.duplicate_count,
        rejectedCount: again.rejected_count,
        message: "Ingestion déjà finalisée par une autre synchronisation.",
      };
    }
    if (again?.ingest_started_at) {
      return {
        phase: "ingesting_elsewhere",
        batchId,
        apifyRunId: runId,
        datasetId,
        externalStatus: run.status,
        message: "Finalisation déjà en cours (autre appel sync ou ingestion en cours).",
      };
    }
    return {
      phase: "running",
      batchId,
      apifyRunId: runId,
      datasetId,
      externalStatus: run.status,
      message: "État batch inattendu ; réessayez.",
    };
  }

  await batches
    .update({
      external_dataset_id: datasetId,
      external_status: run.status,
    } as never)
    .eq("id", batchId);

  const fetchedCount = rawItems.length;

  const mappedRows: LeadGenerationRawStockInput[] = [];
  for (let i = 0; i < rawItems.length; i++) {
    const mapped = mapGoogleMapsApifyItem(rawItems[i], i);
    if (mapped.ok) mappedRows.push(mapped.row);
  }

  const ingest = await ingestLeadGenerationStock(batchId, mappedRows);

  if (!ingest.ok) {
    const errMsg = ingest.message ?? "Ingestion échouée.";
    return {
      phase: "failed",
      batchId,
      apifyRunId: runId,
      datasetId,
      fetchedCount,
      externalStatus: run.status,
      ingestedCount: ingest.summary?.imported_count ?? 0,
      acceptedCount: ingest.summary?.accepted_count ?? 0,
      duplicateCount: ingest.summary?.duplicate_count ?? 0,
      rejectedCount: ingest.summary?.rejected_count ?? 0,
      error: errMsg,
      message: errMsg,
    };
  }

  const s = ingest.summary;
  if (partialRecoveryMeta) {
    const cur = await getLeadGenerationImportBatchById(batchId);
    const metaRoot =
      typeof cur?.metadata_json === "object" &&
      cur.metadata_json !== null &&
      !Array.isArray(cur.metadata_json)
        ? { ...(cur.metadata_json as Record<string, unknown>) }
        : {};
    await batches
      .update({
        metadata_json: {
          ...metaRoot,
          [APIFY_PARTIAL_IMPORT_META_KEY]: partialRecoveryMeta,
        } as unknown as Json,
        error_summary: null,
        external_status: run.status,
      } as never)
      .eq("id", batchId);
  }

  return {
    phase: "completed",
    batchId,
    apifyRunId: runId,
    datasetId,
    externalStatus: run.status,
    fetchedCount,
    ingestedCount: s.imported_count,
    acceptedCount: s.accepted_count,
    duplicateCount: s.duplicate_count,
    rejectedCount: s.rejected_count,
    partialApifyDatasetRecovery: Boolean(partialRecoveryMeta),
    message: "Import finalisé.",
  };
}
