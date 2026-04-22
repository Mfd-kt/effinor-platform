import { startApifyActorRun } from "../../client";
import { LEBONCOIN_IMMOBILIER_ACTOR_ID } from "./config";
import type { LeboncoinImmobilierInput } from "./actor-input";
import { leboncoinImmobilierInputSchema } from "./actor-input";
import { createClient } from "@/lib/supabase/server";

export type StartLeboncoinImportResult =
  | { ok: true; batchId: string; externalRunId: string; externalDatasetId: string }
  | { ok: false; error: string };

/**
 * Lance un import Le Bon Coin Immobilier via Apify et crée le batch en DB.
 * Le run Apify est lancé en async ; la sync des résultats se fait plus tard
 * via syncLeboncoinImport() (soit par cron, soit par bouton "Actualiser").
 */
export async function startLeboncoinImmobilierImport(
  input: Partial<LeboncoinImmobilierInput>,
  ctx: { userId: string; ceeSheetId?: string | null },
): Promise<StartLeboncoinImportResult> {
  // 1. Injecter les credentials depuis les vars d'env
  const inputWithCreds: Partial<LeboncoinImmobilierInput> = {
    ...input,
    includePhone: input.includePhone ?? true,
    email: process.env.LBC_SCRAPING_EMAIL,
    password: process.env.LBC_SCRAPING_PASSWORD,
  };

  // 2. Valider avec Zod
  const parsed = leboncoinImmobilierInputSchema.safeParse(inputWithCreds);
  if (!parsed.success) {
    return {
      ok: false,
      error: `Input invalide : ${parsed.error.issues.map((i) => i.message).join(", ")}`,
    };
  }

  // 3. Créer le batch en DB (status = 'pending')
  const supabase = await createClient();
  const { data: batch, error: batchError } = await supabase
    .from("lead_generation_import_batches")
    .insert({
      source: "leboncoin_immobilier",
      source_label: "Le Bon Coin — Immobilier",
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

  // 4. Lancer le run Apify
  try {
    const run = await startApifyActorRun(LEBONCOIN_IMMOBILIER_ACTOR_ID, parsed.data);

    // 5. Marquer le batch comme running et stocker les refs Apify
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

    return {
      ok: true,
      batchId: batch.id,
      externalRunId: run.id,
      externalDatasetId: run.defaultDatasetId,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Apify start run failed";

    // Marquer le batch failed si Apify a refusé
    await supabase
      .from("lead_generation_import_batches")
      .update({
        status: "failed",
        error_summary: errorMsg.slice(0, 500),
      })
      .eq("id", batch.id);

    return { ok: false, error: errorMsg };
  }
}
