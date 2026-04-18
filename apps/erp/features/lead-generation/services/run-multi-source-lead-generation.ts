import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import { lgTable } from "../lib/lg-db";
import { startGoogleMapsApifyImport } from "../apify/start-google-maps-apify-import";
import { startYellowPagesApifyImport } from "../apify/start-yellow-pages-apify-import";
import { getYellowPagesActorId } from "../apify/client";
import type { RunYellowPagesApifyImportInput } from "../apify/types";

export type RunMultiSourceLeadGenerationOk = {
  coordinatorBatchId: string;
  mapsBatchId: string;
  yellowPagesBatchId?: string;
  ypSkipped: boolean;
  deferYellowPages?: boolean;
};

export type RunMultiSourceLeadGenerationOutcome =
  | { ok: true; data: RunMultiSourceLeadGenerationOk }
  | { ok: false; error: string; coordinatorBatchId?: string };

/**
 * Lance en parallèle (côté Apify) Google Maps + Pages Jaunes, rattachés à un batch coordinateur.
 * L’ingestion réelle est différée : `syncMultiSourceCoordinatorImport` fusionne les datasets puis appelle `ingestLeadGenerationStock`.
 */
export async function runMultiSourceLeadGeneration(
  input: RunYellowPagesApifyImportInput,
): Promise<RunMultiSourceLeadGenerationOutcome> {
  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const now = new Date().toISOString();

  const ypActorConfigured = Boolean(getYellowPagesActorId());
  const deferYellowPages = Boolean(input.deferYellowPages && ypActorConfigured);

  const campaignName = input.campaignName?.trim();
  const coordLabel =
    campaignName && campaignName.length > 0
      ? deferYellowPages
        ? `${campaignName.slice(0, 72)} · Parcours unifié`
        : `${campaignName.slice(0, 80)} · Multi-source`
      : deferYellowPages
        ? "Parcours unifié (carte puis annuaire)"
        : "Import multi-source (Maps + Pages Jaunes)";

  const { data: coordIns, error: coordErr } = await batches
    .insert({
      source: "apify_multi_source",
      source_label: coordLabel.slice(0, 200),
      status: "running",
      started_at: now,
      metadata_json: {
        multiSource: {
          phase: "starting",
          ...(deferYellowPages ? { deferYellowPages: true } : {}),
        },
      } as unknown as Json,
    })
    .select("id")
    .single();

  if (coordErr || !coordIns) {
    return { ok: false, error: coordErr?.message ?? "Création du coordinateur impossible." };
  }

  const coordinatorBatchId = (coordIns as { id: string }).id;

  async function failCoordinator(msg: string): Promise<void> {
    const finishedAt = new Date().toISOString();
    await batches
      .update({
        status: "failed",
        finished_at: finishedAt,
        error_summary: msg.slice(0, 2000),
      } as never)
      .eq("id", coordinatorBatchId);
  }

  const maps = await startGoogleMapsApifyImport({
    ...input,
    multiSourceCoordinatorBatchId: coordinatorBatchId,
    multiSourceDeferIngest: true,
  });

  if (!maps.ok) {
    await failCoordinator(maps.error);
    return { ok: false, error: maps.error, coordinatorBatchId };
  }

  const mapsBatchId = maps.data.batchId;
  let yellowPagesBatchId: string | undefined;
  let ypSkipped = !ypActorConfigured || deferYellowPages;

  if (ypActorConfigured && !deferYellowPages) {
    const yp = await startYellowPagesApifyImport({
      ...input,
      multiSourceCoordinatorBatchId: coordinatorBatchId,
      multiSourceDeferIngest: true,
    });
    if (yp.ok) {
      yellowPagesBatchId = yp.data.batchId;
      ypSkipped = false;
    } else {
      ypSkipped = true;
    }
  }

  await batches
    .update({
      metadata_json: {
        multiSource: {
          phase: "awaiting_children",
          mapsBatchId,
          yellowPagesBatchId: yellowPagesBatchId ?? null,
          ypSkipped,
          ...(deferYellowPages ? { deferYellowPages: true } : {}),
        },
      } as unknown as Json,
    } as never)
    .eq("id", coordinatorBatchId);

  return {
    ok: true,
    data: {
      coordinatorBatchId,
      mapsBatchId,
      ...(yellowPagesBatchId ? { yellowPagesBatchId } : {}),
      ypSkipped,
      deferYellowPages,
    },
  };
}
