import { getApifyRunStatus, listApifyDatasetItems } from "../../client";
import type { ApifyRunStatus } from "../../types";
import { leboncoinImmobilierItemSchema } from "./actor-output";
import { mapLeboncoinImmobilierItems } from "./map-item";
import { filterRowsByExistingPhone } from "@/features/lead-generation/lib/dedup-by-phone";
import { notifyApifyImportCompleted } from "@/features/lead-generation/services/notify-apify-import-completed";
import { createClient } from "@/lib/supabase/server";

export type SyncLeboncoinImportResult =
  | {
      ok: true;
      status: "running" | "completed" | "failed";
      insertedCount: number;
      duplicateCount: number;
      totalFetched: number;
      phoneQuotaExhausted: boolean;
    }
  | { ok: false; error: string };

/**
 * Syncronise un batch Le Bon Coin : lit l'état du run Apify, récupère les items
 * si le run est terminé, les mappe et les insère dans lead_generation_stock.
 * Idempotent : peut être appelé plusieurs fois sans créer de doublons grâce
 * à la contrainte d'unicité sur (source, source_external_id).
 */
export async function syncLeboncoinImmobilierImport(
  batchId: string,
): Promise<SyncLeboncoinImportResult> {
  const supabase = await createClient();

  // 1. Lire le batch en DB
  const { data: batch, error: batchErr } = await supabase
    .from("lead_generation_import_batches")
    .select("id, status, external_run_id, external_dataset_id, source")
    .eq("id", batchId)
    .single();

  if (batchErr || !batch) {
    return { ok: false, error: `Batch introuvable : ${batchErr?.message ?? "unknown"}` };
  }

  if (batch.source !== "leboncoin_immobilier") {
    return { ok: false, error: `Source inattendue : ${batch.source}` };
  }

  if (!batch.external_run_id || !batch.external_dataset_id) {
    return { ok: false, error: "Batch sans référence Apify — rien à syncer" };
  }

  if (batch.status === "completed" || batch.status === "failed") {
    return {
      ok: true,
      status: batch.status,
      insertedCount: 0,
      duplicateCount: 0,
      totalFetched: 0,
      phoneQuotaExhausted: false,
    };
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
    return { ok: false, error: msg };
  }

  // Mettre à jour le statut externe
  await supabase
    .from("lead_generation_import_batches")
    .update({ external_status: run.status })
    .eq("id", batch.id);

  // 3. Si le run n'est pas fini, on retourne running
  if (run.status === "RUNNING" || run.status === "READY") {
    return {
      ok: true,
      status: "running",
      insertedCount: 0,
      duplicateCount: 0,
      totalFetched: 0,
      phoneQuotaExhausted: false,
    };
  }

  // 4. Si le run a échoué, marquer failed
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

    return {
      ok: true,
      status: "failed",
      insertedCount: 0,
      duplicateCount: 0,
      totalFetched: 0,
      phoneQuotaExhausted: false,
    };
  }

  // 5. Run SUCCEEDED → récupérer les items et les insérer
  const rawItems = await listApifyDatasetItems(batch.external_dataset_id, { limit: 10_000 });

  // Valider chaque item avec Zod (tolérant, filtre les items invalides)
  const validItems = rawItems
    .map((raw) => {
      const parsed = leboncoinImmobilierItemSchema.safeParse(raw);
      return parsed.success ? parsed.data : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Détecter le flag quota téléphone
  const phoneQuotaExhausted = validItems.some((item) => item.phoneQuotaExhausted === true);

  // Mapper en format DB
  const stockRows = mapLeboncoinImmobilierItems(validItems);

  // Ajouter le batch_id à chaque row
  const rowsWithBatch = stockRows.map((row) => ({
    ...row,
    /**
     * LBC renvoie des particuliers / pros avec téléphone : on saute la
     * quantification et on rend la fiche directement appelable par les agents.
     * Pré-requis dispatch RPC : stock_status='ready' + qualification_status='qualified'
     * + phone_status='found' + dispatch_queue_status='ready_now'.
     */
    qualification_status: "qualified" as const,
    stock_status: row.phone ? ("ready" as const) : ("new" as const),
    phone_status: row.phone ? ("found" as const) : ("missing" as const),
    import_batch_id: batch.id,
    imported_at: new Date().toISOString(),
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
    console.log("[sync-leboncoin] dédup phone", {
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
        console.error("[sync-leboncoin] insert error:", insertErr);
      } else if (inserted) {
        insertedCount += inserted.length;
      }
    }
  }

  // 7. Finaliser le batch
  await supabase
    .from("lead_generation_import_batches")
    .update({
      status: "completed",
      imported_count: validItems.length,
      accepted_count: insertedCount,
      duplicate_count: duplicateCount,
      rejected_count: rawItems.length - validItems.length,
      finished_at: new Date().toISOString(),
      metadata_json: {
        phone_quota_exhausted: phoneQuotaExhausted,
        raw_items_count: rawItems.length,
        valid_items_count: validItems.length,
      },
    })
    .eq("id", batch.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await notifyApifyImportCompleted({
    batchId: batch.id,
    outcome: "success",
    source: "leboncoin_immobilier",
    inserted: insertedCount,
    duplicates: duplicateCount,
    rejected: rawItems.length - validItems.length,
    client: supabase as any,
  });

  return {
    ok: true,
    status: "completed",
    insertedCount,
    duplicateCount,
    totalFetched: validItems.length,
    phoneQuotaExhausted,
  };
}
