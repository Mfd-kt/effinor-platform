import { startApifyActorRun } from "../../client";
import { PAP_ACTOR_ID, PAP_SOURCE_CODE, PAP_SOURCE_LABEL } from "./config";
import type { PapActorInput } from "./actor-input";
import { papActorInputSchema } from "./actor-input";
import { createClient } from "@/lib/supabase/server";

export type StartPapImportResult =
  | { ok: true; batchId: string; externalRunId: string; externalDatasetId: string }
  | { ok: false; error: string };

/**
 * Lance un import PAP.fr via Apify et crée le batch en DB.
 * Le run Apify est lancé en async ; la sync des résultats se fait plus tard
 * via syncPapImport() (cron toutes les 3 min ou bouton "Actualiser").
 */
export async function startPapImport(
  input: Partial<PapActorInput>,
  ctx: { userId: string; ceeSheetId?: string | null },
): Promise<StartPapImportResult> {
  // 1. Valider l'input avec Zod
  const parsed = papActorInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: `Input invalide : ${parsed.error.issues.map((i) => i.message).join(", ")}`,
    };
  }

  // 2. Créer le batch en DB (status = 'pending')
  const supabase = await createClient();
  const { data: batch, error: batchError } = await supabase
    .from("lead_generation_import_batches")
    .insert({
      source: PAP_SOURCE_CODE,
      source_label: PAP_SOURCE_LABEL,
      status: "pending",
      metadata_json: {
        triggered_by_user_id: ctx.userId,
        cee_sheet_id: ctx.ceeSheetId ?? null,
        input: parsed.data,
      },
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    return {
      ok: false,
      error: `Impossible de créer le batch : ${batchError?.message ?? "unknown"}`,
    };
  }

  // 3. Lancer le run Apify
  // `parsed.data` est l’input acteur (startUrl + maxItemsToScrape), sérialisé tel quel vers l’API Apify.
  try {
    const actorInput = parsed.data;
    console.log("[start-pap] 🚀 Lancement acteur avec input:", JSON.stringify(actorInput, null, 2));
    const run = await startApifyActorRun(PAP_ACTOR_ID, actorInput);

    // 4. Marquer le batch comme running et stocker les refs Apify
    await supabase
      .from("lead_generation_import_batches")
      .update({
        status: "running",
        external_run_id: run.id,
        external_dataset_id: run.defaultDatasetId,
        external_status: run.status,
        ingest_started_at: new Date().toISOString(),
      })
      .eq("id", batch.id);

    console.log("[start-pap] Apify run started", {
      batchId: batch.id,
      runId: run.id,
      datasetId: run.defaultDatasetId,
    });

    return {
      ok: true,
      batchId: batch.id,
      externalRunId: run.id,
      externalDatasetId: run.defaultDatasetId,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Apify start run failed";

    await supabase
      .from("lead_generation_import_batches")
      .update({
        status: "failed",
        error_summary: errorMsg.slice(0, 500),
      })
      .eq("id", batch.id);

    console.error("[start-pap] Apify start failed", { batchId: batch.id, error: errorMsg });
    return { ok: false, error: errorMsg };
  }
}
