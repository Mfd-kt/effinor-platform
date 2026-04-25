import { getApifyRunStatus, listApifyDatasetItems } from "../../client";
import type { ApifyRunStatus } from "../../types";
import { evaluateLeadGenerationDispatchQueueBatch } from "@/features/lead-generation/queue/evaluate-dispatch-queue";
import { filterRowsByExistingPhone } from "@/features/lead-generation/lib/dedup-by-phone";
import { notifyApifyImportCompleted } from "@/features/lead-generation/services/notify-apify-import-completed";
import { PAP_SOURCE_CODE } from "./config";
import type { PapStockRow } from "./map-item";
import { PAP_REJECT_INSPECT_LIMIT, processPapRawDatasetItems } from "./map-item";
import { createAdminClient } from "@/lib/supabase/admin";

/** Client service : sync appelée par cron (sans session) ou action serveur — la RLS `authenticated` bloquerait sinon les écritures stock. */
type SupabaseServer = ReturnType<typeof createAdminClient>;

function mergeImportBatchMetadata(prev: unknown): Record<string, unknown> {
  if (prev && typeof prev === "object" && !Array.isArray(prev)) {
    return { ...(prev as Record<string, unknown>) };
  }
  return {};
}

/** Recalcule la file dispatch pour toutes les fiches du lot (service_role — OK sans session). */
async function runDispatchEvalForImportBatch(supabase: SupabaseServer, batchId: string): Promise<void> {
  const { data: idRows, error } = await supabase
    .from("lead_generation_stock")
    .select("id")
    .eq("import_batch_id", batchId)
    .is("converted_lead_id", null);
  if (error) {
    console.error("[sync-pap] liste ids stock pour dispatch", { batchId, error: error.message });
    return;
  }
  const ids = (idRows ?? []).map((r: { id: string }) => r.id);
  const CHUNK = 100;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    const summary = await evaluateLeadGenerationDispatchQueueBatch(slice, { supabase });
    console.log("[sync-pap] dispatch eval", { batchId, offset: i, ...summary });
  }
}

/** Met à jour `import_batch_id` sur les fiches PAP déjà en base (y compris doublons upsert ignorés). */
async function tagPapStockRowsWithImportBatch(
  supabase: SupabaseServer,
  batchId: string,
  stockRows: readonly Pick<PapStockRow, "source_external_id">[],
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
      .eq("source", PAP_SOURCE_CODE)
      .in("source_external_id", slice);
    if (tagErr) {
      console.error("[sync-pap] import_batch_id tag failed", {
        batchId,
        error: tagErr.message,
      });
    }
  }
}

/**
 * Lot déjà « completed » : re-lit le dataset Apify et rattache `import_batch_id`
 * (correctif lots syncés avant le tag explicite post-upsert).
 */
async function repairPapCompletedBatchStockLinks(
  supabase: SupabaseServer,
  batchId: string,
  externalDatasetId: string | null,
): Promise<SyncPapImportResult> {
  if (!externalDatasetId) {
    return { ok: false, error: "Batch sans dataset Apify." };
  }
  const rawItems = await listApifyDatasetItems(externalDatasetId, { limit: 10_000 });

  const { data: metaRow } = await supabase
    .from("lead_generation_import_batches")
    .select("metadata_json")
    .eq("id", batchId)
    .maybeSingle();

  const prevMeta = mergeImportBatchMetadata(metaRow?.metadata_json);
  const processed = processPapRawDatasetItems(rawItems);
  const importedAt = new Date().toISOString();
  await tagPapStockRowsWithImportBatch(supabase, batchId, processed.rows, importedAt);

  const totalRejected = processed.zodRejected + processed.filterRejected;
  await supabase
    .from("lead_generation_import_batches")
    .update({
      metadata_json: {
        ...prevMeta,
        pap_rejected_inspection: processed.rejectInspect,
        pap_rejected_inspection_total: totalRejected,
        pap_rejected_inspection_capped: totalRejected > PAP_REJECT_INSPECT_LIMIT,
      },
    })
    .eq("id", batchId);

  await runDispatchEvalForImportBatch(supabase, batchId);

  console.log("[sync-pap] repaired import_batch_id for completed batch", {
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

export type SyncPapImportResult =
  | {
      ok: true;
      status: "running" | "completed" | "failed";
      insertedCount: number;
      duplicateCount: number;
      totalFetched: number;
    }
  | { ok: false; error: string };

/**
 * Synchronise un batch PAP : lit l'état du run Apify, récupère les items
 * si le run est terminé, les mappe et les insère dans `lead_generation_stock`.
 *
 * Idempotent — peut être appelé plusieurs fois sans créer de doublons grâce
 * à la contrainte d'unicité sur (source, source_external_id).
 */
export async function syncPapImport(batchId: string): Promise<SyncPapImportResult> {
  const supabase = createAdminClient();

  // 1. Lire le batch en DB
  const { data: batch, error: batchErr } = await supabase
    .from("lead_generation_import_batches")
    .select("id, status, external_run_id, external_dataset_id, source, metadata_json")
    .eq("id", batchId)
    .single();

  if (batchErr || !batch) {
    return { ok: false, error: `Batch introuvable : ${batchErr?.message ?? "unknown"}` };
  }

  if (batch.source !== PAP_SOURCE_CODE) {
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
    return repairPapCompletedBatchStockLinks(supabase, batch.id, batch.external_dataset_id);
  }

  // 2. Interroger Apify pour l'état du run
  let run: { status: ApifyRunStatus };
  try {
    run = await getApifyRunStatus(batch.external_run_id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Apify get run failed";
    await supabase
      .from("lead_generation_import_batches")
      .update({ external_status: "ERROR", error_summary: msg.slice(0, 500) })
      .eq("id", batch.id);
    console.error("[sync-pap] getRunStatus failed", { batchId: batch.id, error: msg });
    return { ok: false, error: msg };
  }

  await supabase
    .from("lead_generation_import_batches")
    .update({ external_status: run.status })
    .eq("id", batch.id);

  // 3. Run pas fini → on retourne running
  if (run.status === "RUNNING" || run.status === "READY") {
    return {
      ok: true,
      status: "running",
      insertedCount: 0,
      duplicateCount: 0,
      totalFetched: 0,
    };
  }

  // 4. Run échoué → marquer failed
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

    console.warn("[sync-pap] Apify run terminal-failed", {
      batchId: batch.id,
      apifyStatus: run.status,
    });

    await notifyApifyImportCompleted({
      batchId: batch.id,
      outcome: "failure",
      source: PAP_SOURCE_CODE,
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

  // 5. Run SUCCEEDED → récupérer les items
  const rawItems = await listApifyDatasetItems(batch.external_dataset_id, { limit: 10_000 });

  const prevMeta = mergeImportBatchMetadata(batch.metadata_json);
  const {
    rows: stockRows,
    rejectInspect,
    zodRejected,
    filterRejected,
  } = processPapRawDatasetItems(rawItems);

  for (const e of rejectInspect.slice(0, 25)) {
    console.log(`[sync-pap] ❌ ${e.stage} ${e.external_id ?? "?"}: ${e.reason}`);
  }

  const totalRejected = zodRejected + filterRejected;
  console.log(
    `[sync-pap] 📊 ${stockRows.length} acceptés / ${filterRejected} rejetés (filtre CEE) / ${zodRejected} rejetés (forme) sur ${rawItems.length} items`,
  );

  const importedAt = new Date().toISOString();
  const rowsWithBatch = stockRows.map((row) => ({
    ...row,
    /**
     * PAP renvoie des particuliers vérifiés avec téléphone : on saute la
     * quantification et on rend la fiche directement appelable par les agents.
     * Pré-requis dispatch RPC : stock_status='ready' + qualification_status='qualified'
     * + phone_status='found' + dispatch_queue_status='ready_now'.
     */
    qualification_status: "qualified" as const,
    stock_status: row.phone ? ("ready" as const) : ("new" as const),
    phone_status: row.phone ? ("found" as const) : ("missing" as const),
    import_batch_id: batch.id,
    imported_at: importedAt,
  }));

  // 6. Dédup par téléphone (intra-batch + vs DB) puis INSERT plain
  let insertedCount = 0;
  let duplicateCount = 0;

  if (rowsWithBatch.length > 0) {
    const { toInsert, intraBatchDuplicates, dbDuplicates } = await filterRowsByExistingPhone(
      supabase,
      rowsWithBatch,
    );
    duplicateCount = intraBatchDuplicates + dbDuplicates;
    console.log("[sync-pap] dédup phone", {
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
        console.error("[sync-pap] insert error", {
          batchId: batch.id,
          chunkIndex: i,
          error: insertErr.message,
        });
      } else if (inserted) {
        insertedCount += inserted.length;
      }
    }

    /**
     * Re-tag les fiches déjà en DB (même téléphone) au lot courant pour la vue
     * « Stock lié à cet import » (sinon elles restent visibles uniquement sur leur
     * batch d'origine).
     */
    await tagPapStockRowsWithImportBatch(supabase, batch.id, rowsWithBatch, importedAt);

    const { count: taggedStockCount, error: countErr } = await supabase
      .from("lead_generation_stock")
      .select("id", { count: "exact", head: true })
      .eq("import_batch_id", batch.id);
    if (!countErr) {
      console.log("[sync-pap] fiches avec import_batch_id = ce lot", {
        batchId: batch.id,
        count: taggedStockCount ?? 0,
      });
    }

    await runDispatchEvalForImportBatch(supabase, batch.id);
  }

  // 7. Finaliser le batch
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
        pap_rejected_inspection_capped: totalRejected > PAP_REJECT_INSPECT_LIMIT,
        rejection_reasons_preview: rejectInspect.slice(0, 50).map((e) => `${e.stage}: ${e.reason}`),
      },
    })
    .eq("id", batch.id);

  console.log("[sync-pap] batch completed", {
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
    source: PAP_SOURCE_CODE,
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
