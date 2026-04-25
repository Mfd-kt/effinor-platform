import { getApifyRunStatus, listApifyDatasetItems } from "../../client";
import type { ApifyRunStatus } from "../../types";
import { evaluateLeadGenerationDispatchQueueBatch } from "@/features/lead-generation/queue/evaluate-dispatch-queue";
import { filterRowsByExistingPhone } from "@/features/lead-generation/lib/dedup-by-phone";
import { notifyApifyImportCompleted } from "@/features/lead-generation/services/notify-apify-import-completed";
import { PAP_LOCATION_SOURCE_CODE } from "./config";
import type { PapLocationStockRow } from "./map-item";
import { PAP_LOCATION_REJECT_INSPECT_LIMIT, processPapLocationRawDatasetItems } from "./map-item";
import { createAdminClient } from "@/lib/supabase/admin";

type SupabaseServer = ReturnType<typeof createAdminClient>;

function mergeImportBatchMetadata(prev: unknown): Record<string, unknown> {
  if (prev && typeof prev === "object" && !Array.isArray(prev)) {
    return { ...(prev as Record<string, unknown>) };
  }
  return {};
}

async function runDispatchEvalForImportBatch(supabase: SupabaseServer, batchId: string): Promise<void> {
  const { data: idRows, error } = await supabase
    .from("lead_generation_stock")
    .select("id")
    .eq("import_batch_id", batchId)
    .is("converted_lead_id", null);
  if (error) {
    console.error("[sync-pap-location] liste ids stock pour dispatch", { batchId, error: error.message });
    return;
  }
  const ids = (idRows ?? []).map((r: { id: string }) => r.id);
  const CHUNK = 100;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    const summary = await evaluateLeadGenerationDispatchQueueBatch(slice, { supabase });
    console.log("[sync-pap-location] dispatch eval", { batchId, offset: i, ...summary });
  }
}

async function tagPapLocationStockRowsWithImportBatch(
  supabase: SupabaseServer,
  batchId: string,
  stockRows: readonly Pick<PapLocationStockRow, "source_external_id">[],
  importedAt: string,
): Promise<void> {
  if (stockRows.length === 0) return;
  const externalIds = stockRows.map((r) => r.source_external_id);
  const TAG_CHUNK = 300;
  for (let j = 0; j < externalIds.length; j += TAG_CHUNK) {
    const slice = externalIds.slice(j, j + TAG_CHUNK);
    const { error: tagErr } = await supabase
      .from("lead_generation_stock")
      .update({ import_batch_id: batchId, imported_at: importedAt })
      .eq("source", PAP_LOCATION_SOURCE_CODE)
      .in("source_external_id", slice);
    if (tagErr) {
      console.error("[sync-pap-location] import_batch_id tag failed", {
        batchId,
        error: tagErr.message,
      });
    }
  }
}

async function repairPapLocationCompletedBatchStockLinks(
  supabase: SupabaseServer,
  batchId: string,
  externalDatasetId: string | null,
): Promise<SyncPapLocationImportResult> {
  if (!externalDatasetId) {
    return { ok: false, error: "Batch sans dataset Apify." };
  }
  const rawItems = await listApifyDatasetItems(externalDatasetId, { limit: 10_000 });

  const { data: metaRow } = await supabase
    .from("lead_generation_import_batches")
    .select("metadata_json")
    .eq("id", batchId)
    .single();

  const prevMeta = mergeImportBatchMetadata(metaRow?.metadata_json);
  const processed = processPapLocationRawDatasetItems(rawItems);
  const importedAt = new Date().toISOString();
  await tagPapLocationStockRowsWithImportBatch(supabase, batchId, processed.rows, importedAt);

  const totalRejected = processed.zodRejected + processed.filterRejected;
  await supabase
    .from("lead_generation_import_batches")
    .update({
      metadata_json: {
        ...prevMeta,
        pap_rejected_inspection: processed.rejectInspect,
        pap_rejected_inspection_total: totalRejected,
        pap_rejected_inspection_capped: totalRejected > PAP_LOCATION_REJECT_INSPECT_LIMIT,
      },
    })
    .eq("id", batchId);

  await runDispatchEvalForImportBatch(supabase, batchId);

  console.log("[sync-pap-location] repaired import_batch_id for completed batch", {
    batchId,
    taggedRows: processed.rows.length,
  });
  return {
    ok: true,
    status: "completed",
    insertedCount: 0,
    duplicateCount: 0,
    totalFetched: processed.rows.length,
  };
}

export type SyncPapLocationImportResult =
  | {
      ok: true;
      status: "running" | "completed" | "failed";
      insertedCount: number;
      duplicateCount: number;
      totalFetched: number;
    }
  | { ok: false; error: string };

export async function syncPapLocationImport(batchId: string): Promise<SyncPapLocationImportResult> {
  const supabase = createAdminClient();

  const { data: batch, error: batchErr } = await supabase
    .from("lead_generation_import_batches")
    .select("id, status, external_run_id, external_dataset_id, source, metadata_json")
    .eq("id", batchId)
    .single();

  if (batchErr || !batch) {
    return { ok: false, error: `Batch introuvable : ${batchErr?.message ?? "unknown"}` };
  }

  if (batch.source !== PAP_LOCATION_SOURCE_CODE) {
    return { ok: false, error: `Source inattendue : ${batch.source}` };
  }

  if (!batch.external_run_id || !batch.external_dataset_id) {
    return { ok: false, error: "Batch sans référence Apify — rien à syncer" };
  }

  if (batch.status === "failed") {
    return {
      ok: true,
      status: "failed",
      insertedCount: 0,
      duplicateCount: 0,
      totalFetched: 0,
    };
  }

  if (batch.status === "completed") {
    return repairPapLocationCompletedBatchStockLinks(supabase, batch.id, batch.external_dataset_id);
  }

  let run: { status: ApifyRunStatus };
  try {
    run = await getApifyRunStatus(batch.external_run_id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Apify get run failed";
    await supabase
      .from("lead_generation_import_batches")
      .update({ external_status: "ERROR", error_summary: msg.slice(0, 500) })
      .eq("id", batch.id);
    console.error("[sync-pap-location] getRunStatus failed", { batchId: batch.id, error: msg });
    return { ok: false, error: msg };
  }

  await supabase
    .from("lead_generation_import_batches")
    .update({ external_status: run.status })
    .eq("id", batch.id);

  if (run.status === "RUNNING" || run.status === "READY") {
    return {
      ok: true,
      status: "running",
      insertedCount: 0,
      duplicateCount: 0,
      totalFetched: 0,
    };
  }

  if (
    run.status === "FAILED" ||
    run.status === "ABORTED" ||
    run.status === "TIMED-OUT" ||
    run.status === "TIMING-OUT" ||
    run.status === "ABORTING"
  ) {
    await supabase
      .from("lead_generation_import_batches")
      .update({
        status: "failed",
        error_summary: `Apify run ${run.status}`,
        finished_at: new Date().toISOString(),
      })
      .eq("id", batch.id);

    console.warn("[sync-pap-location] Apify run terminal-failed", {
      batchId: batch.id,
      apifyStatus: run.status,
    });

    await notifyApifyImportCompleted({
      batchId: batch.id,
      outcome: "failure",
      source: PAP_LOCATION_SOURCE_CODE,
      errorSummary: `Apify run ${run.status}`,
      client: supabase,
    });

    return {
      ok: true,
      status: "failed",
      insertedCount: 0,
      duplicateCount: 0,
      totalFetched: 0,
    };
  }

  const rawItems = await listApifyDatasetItems(batch.external_dataset_id, { limit: 10_000 });

  const prevMeta = mergeImportBatchMetadata(batch.metadata_json);
  const {
    rows: stockRows,
    rejectInspect,
    zodRejected,
    filterRejected,
  } = processPapLocationRawDatasetItems(rawItems);

  for (const e of rejectInspect.slice(0, 25)) {
    console.log(`[sync-pap-location] ❌ ${e.stage} ${e.external_id ?? "?"}: ${e.reason}`);
  }

  const totalRejected = zodRejected + filterRejected;
  console.log(
    `[sync-pap-location] 📊 ${stockRows.length} acceptés / ${filterRejected} rejetés (filtre CEE) / ${zodRejected} rejetés (forme) sur ${rawItems.length} items`,
  );

  const importedAt = new Date().toISOString();
  const rowsWithBatch = stockRows.map((row) => ({
    ...row,
    /**
     * PAP renvoie des particuliers vérifiés avec téléphone : on saute la
     * quantification et on rend la fiche directement appelable par les agents.
     */
    qualification_status: "qualified" as const,
    stock_status: row.phone ? ("ready" as const) : ("new" as const),
    phone_status: row.phone ? ("found" as const) : ("missing" as const),
    import_batch_id: batch.id,
    imported_at: importedAt,
  }));

  let insertedCount = 0;
  let duplicateCount = 0;

  if (rowsWithBatch.length > 0) {
    const { toInsert, intraBatchDuplicates, dbDuplicates } = await filterRowsByExistingPhone(
      supabase,
      rowsWithBatch,
    );
    duplicateCount = intraBatchDuplicates + dbDuplicates;
    console.log("[sync-pap-location] dédup phone", {
      batchId: batch.id,
      total: rowsWithBatch.length,
      toInsert: toInsert.length,
      intraBatchDuplicates,
      dbDuplicates,
    });

    const CHUNK_SIZE = 500;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      const { data: inserted, error: insertErr } = await supabase
        .from("lead_generation_stock")
        .insert(chunk)
        .select("id");

      if (insertErr) {
        console.error("[sync-pap-location] insert error", {
          batchId: batch.id,
          chunkIndex: i,
          error: insertErr.message,
        });
      } else if (inserted) {
        insertedCount += inserted.length;
      }
    }

    await tagPapLocationStockRowsWithImportBatch(supabase, batch.id, rowsWithBatch, importedAt);

    const { count: taggedStockCount, error: countErr } = await supabase
      .from("lead_generation_stock")
      .select("id", { count: "exact", head: true })
      .eq("import_batch_id", batch.id);
    if (!countErr) {
      console.log("[sync-pap-location] fiches avec import_batch_id = ce lot", {
        batchId: batch.id,
        count: taggedStockCount ?? 0,
      });
    }

    await runDispatchEvalForImportBatch(supabase, batch.id);
  }

  await supabase
    .from("lead_generation_import_batches")
    .update({
      status: "completed",
      imported_count: stockRows.length,
      accepted_count: insertedCount,
      duplicate_count: duplicateCount,
      rejected_count: totalRejected,
      finished_at: new Date().toISOString(),
      metadata_json: {
        ...prevMeta,
        raw_items_count: rawItems.length,
        zod_valid_count: rawItems.length - zodRejected,
        filter_rejected_count: filterRejected,
        zod_rejected_count: zodRejected,
        rows_with_phone: rowsWithBatch.filter((r) => r.phone !== null).length,
        pap_rejected_inspection: rejectInspect,
        pap_rejected_inspection_total: totalRejected,
        pap_rejected_inspection_capped: totalRejected > PAP_LOCATION_REJECT_INSPECT_LIMIT,
        rejection_reasons_preview: rejectInspect.slice(0, 50).map((e) => `${e.stage}: ${e.reason}`),
      },
    })
    .eq("id", batch.id);

  console.log("[sync-pap-location] batch completed", {
    batchId: batch.id,
    rawItems: rawItems.length,
    accepted: stockRows.length,
    inserted: insertedCount,
    duplicates: duplicateCount,
    rejected: totalRejected,
    withPhone: rowsWithBatch.filter((r) => r.phone !== null).length,
  });

  await notifyApifyImportCompleted({
    batchId: batch.id,
    outcome: "success",
    source: PAP_LOCATION_SOURCE_CODE,
    inserted: insertedCount,
    duplicates: duplicateCount,
    rejected: totalRejected,
    client: supabase,
  });

  return {
    ok: true,
    status: "completed",
    insertedCount,
    duplicateCount,
    totalFetched: stockRows.length,
  };
}
