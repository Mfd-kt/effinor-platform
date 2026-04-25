import { startApifyActorRun } from "../../client";
import {
  PAP_LOCATION_ACTOR_ID,
  PAP_LOCATION_SOURCE_CODE,
  PAP_LOCATION_SOURCE_LABEL,
} from "./config";
import type { PapLocationActorInput } from "./actor-input";
import { papLocationActorInputSchema } from "./actor-input";
import { createClient } from "@/lib/supabase/server";

export type StartPapLocationImportResult =
  | { ok: true; batchId: string; externalRunId: string; externalDatasetId: string }
  | { ok: false; error: string };

/**
 * Lance un import PAP **location** via Apify et crée le batch en DB.
 * Le run Apify est lancé en async ; la sync des résultats se fait plus tard
 * via `syncPapLocationImport()` (cron toutes les 3 min ou bouton « Actualiser »).
 */
export async function startPapLocationImport(
  input: Partial<PapLocationActorInput>,
  ctx: { userId: string; ceeSheetId?: string | null },
): Promise<StartPapLocationImportResult> {
  const parsed = papLocationActorInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: `Input invalide : ${parsed.error.issues.map((i) => i.message).join(", ")}`,
    };
  }

  const supabase = await createClient();
  const { data: batch, error: batchError } = await supabase
    .from("lead_generation_import_batches")
    .insert({
      source: PAP_LOCATION_SOURCE_CODE,
      source_label: PAP_LOCATION_SOURCE_LABEL,
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

  try {
    const actorInput = parsed.data;
    console.log("[start-pap-location] 🚀 Lancement acteur avec input:", JSON.stringify(actorInput, null, 2));
    const run = await startApifyActorRun(PAP_LOCATION_ACTOR_ID, actorInput);

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

    console.log("[start-pap-location] Apify run started", {
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

    console.error("[start-pap-location] Apify start failed", { batchId: batch.id, error: errorMsg });
    return { ok: false, error: errorMsg };
  }
}
