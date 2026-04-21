import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import { lgTable } from "../lib/lg-db";
import {
  getLeadGenGoogleMapsGeoOption,
  injectGeoTargetInSearchStrings,
} from "../lib/google-maps-region-options";

import { getApifyEnv, startApifyActorRun } from "./client";
import { leadGenerationBatchCeeInsertColumns, readCeeContextFromApifyInput } from "../lib/lead-generation-batch-cee-columns";
import { buildGoogleMapsActorRunInput, resolveGoogleMapsLocationQuery } from "./google-maps-actor-input";
import type { RunGoogleMapsApifyImportInput, StartGoogleMapsApifyImportOutcome } from "./types";

async function markStartFailed(
  supabase: SupabaseClient,
  batchId: string,
  metadata: Record<string, unknown>,
  errorSummary: string,
): Promise<void> {
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const finishedAt = new Date().toISOString();
  await batches
    .update({
      status: "failed",
      finished_at: finishedAt,
      error_summary: errorSummary.slice(0, 2000),
      metadata_json: { ...metadata, error: errorSummary } as unknown as Json,
    })
    .eq("id", batchId);
}

/**
 * Crée un batch, lance le run Apify et retourne immédiatement (sans poll ni ingestion).
 */
export async function startGoogleMapsApifyImport(
  input: RunGoogleMapsApifyImportInput,
): Promise<StartGoogleMapsApifyImportOutcome> {
  let token: string;
  let actorId: string;
  try {
    const env = getApifyEnv();
    token = env.token;
    actorId = env.actorId;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Configuration Apify invalide.";
    return { ok: false, error: message };
  }

  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const now = new Date().toISOString();

  const locationQuery = resolveGoogleMapsLocationQuery(input);
  const geoTarget = getLeadGenGoogleMapsGeoOption(locationQuery);
  const searchStrings = injectGeoTargetInSearchStrings(input.searchStrings, locationQuery);
  const campaignName = input.campaignName?.trim();
  const sourceLabel =
    campaignName && campaignName.length > 0
      ? campaignName.length > 96
        ? `${campaignName.slice(0, 93)}… · Maps`
        : `${campaignName} · Maps`
      : "Import Google Maps";

  const baseMetadata: Record<string, unknown> = {
    searchStrings,
    locationQuery,
    maxCrawledPlacesPerSearch: input.maxCrawledPlacesPerSearch ?? 50,
    ...(typeof input.includeWebResults === "boolean"
      ? { includeWebResults: input.includeWebResults }
      : {}),
    ...(campaignName ? { campaignName } : {}),
    ...(input.campaignSector?.trim() ? { campaignSector: input.campaignSector.trim() } : {}),
    ...(geoTarget
      ? {
          geoTarget: {
            value: geoTarget.value,
            label: geoTarget.label,
            kind: geoTarget.kind,
            departmentCode: geoTarget.departmentCode ?? null,
          },
        }
      : {}),
  };

  const ceeCols = leadGenerationBatchCeeInsertColumns(readCeeContextFromApifyInput(input));
  const stockInitialQualification = input.stockInitialQualification ?? "qualified";
  const createdBy = input.createdByUserId?.trim() || null;

  const { data: inserted, error: insErr } = await batches
    .insert({
      source: "apify_google_maps",
      source_label: sourceLabel.slice(0, 200),
      status: "running",
      started_at: now,
      metadata_json: baseMetadata as unknown as Json,
      stock_initial_qualification: stockInitialQualification,
      ...(createdBy ? { created_by_user_id: createdBy } : {}),
      ...ceeCols,
    } as never)
    .select("id")
    .single();

  if (insErr || !inserted) {
    return { ok: false, error: insErr?.message ?? "Création du batch impossible." };
  }

  const batchId = (inserted as { id: string }).id;

  try {
    const runInput = buildGoogleMapsActorRunInput({
      ...input,
      searchStrings,
      locationQuery,
    });
    const started = await startApifyActorRun(token, actorId, runInput);
    const apifyRunId = started.id;
    const datasetId = started.defaultDatasetId ?? "";
    const externalStatus = started.status ?? "";

    await batches
      .update({
        job_reference: apifyRunId,
        external_run_id: apifyRunId,
        external_dataset_id: datasetId || null,
        external_status: externalStatus,
        metadata_json: { ...baseMetadata, apifyRunId } as unknown as Json,
      })
      .eq("id", batchId);

    return {
      ok: true,
      data: {
        batchId,
        apifyRunId,
        datasetId,
        externalStatus,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec du démarrage Apify.";
    await markStartFailed(supabase, batchId, baseMetadata, message);
    return {
      ok: false,
      error: message,
      batchId,
    };
  }
}
