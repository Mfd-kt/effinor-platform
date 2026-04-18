import { createClient } from "@/lib/supabase/server";

import { syncGoogleMapsApifyImport } from "../apify/sync-google-maps-apify-import";
import { syncYellowPagesApifyImport } from "../apify/sync-yellow-pages-apify-import";
import type { SyncGoogleMapsApifyImportPhase } from "../apify/types";
import { lgTable } from "../lib/lg-db";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";
import { syncLinkedInEnrichmentApifyImport } from "../services/sync-linkedin-enrichment-apify-import";
import { syncMultiSourceCoordinatorImport } from "../services/sync-multi-source-coordinator-import";

const MAX_BATCHES = 10;
const MAX_COORDINATORS = 3;

function bucketPhase(phase: SyncGoogleMapsApifyImportPhase): "completed" | "still_running" | "failed" {
  if (phase === "completed" || phase === "already_completed" || phase === "completed_deferred") {
    return "completed";
  }
  if (phase === "running" || phase === "ingesting_elsewhere") {
    return "still_running";
  }
  return "failed";
}

export type SyncPendingImportsJobSummary = {
  totalScanned: number;
  totalCompleted: number;
  totalStillRunning: number;
  totalFailed: number;
  batchIds: string[];
  details: Array<{
    batchId: string;
    phase: SyncGoogleMapsApifyImportPhase;
    ingestedCount?: number;
    acceptedCount?: number;
  }>;
};

/**
 * Imports Apify encore « running » avec identifiant run externe, traitement séquentiel borné.
 */
export async function runSyncPendingImportsJob(): Promise<SyncPendingImportsJobSummary> {
  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const { settings } = await getLeadGenerationSettings();
  const cap = settings.automationLimits.sync_pending_imports_limit || MAX_BATCHES;

  const details: SyncPendingImportsJobSummary["details"] = [];
  let totalCompleted = 0;
  let totalStillRunning = 0;
  let totalFailed = 0;
  const batchIds: string[] = [];

  const { data: coordRows, error: coordErr } = await batches
    .select("id")
    .eq("source", "apify_multi_source")
    .eq("status", "running")
    .order("created_at", { ascending: true })
    .limit(MAX_COORDINATORS);

  if (coordErr) {
    throw new Error(`Liste coordinateurs multi-source : ${coordErr.message}`);
  }

  for (const r of coordRows ?? []) {
    const coordinatorBatchId = (r as { id: string }).id;
    const result = await syncMultiSourceCoordinatorImport({ coordinatorBatchId });
    batchIds.push(coordinatorBatchId);
    details.push({
      batchId: coordinatorBatchId,
      phase:
        result.phase === "completed" || result.phase === "already_completed"
          ? "completed"
          : result.phase === "running" || result.phase === "maps_ingested"
            ? "running"
            : "failed",
      ingestedCount: result.mergedRowCount ?? result.ingestedCount,
      acceptedCount: result.acceptedCount,
    });
    if (result.phase === "completed" || result.phase === "already_completed") totalCompleted += 1;
    else if (result.phase === "running" || result.phase === "maps_ingested") totalStillRunning += 1;
    else totalFailed += 1;
  }

  const mapsLimit = Math.max(0, cap - batchIds.length);
  const { data, error } = await batches
    .select("id")
    .eq("source", "apify_google_maps")
    .eq("status", "running")
    .not("external_run_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(mapsLimit);

  if (error) {
    throw new Error(`Liste imports Apify en attente : ${error.message}`);
  }

  const mapsBatchIds = (data ?? []).map((r: { id: string }) => r.id);

  for (const batchId of mapsBatchIds) {
    const result = await syncGoogleMapsApifyImport({ batchId });
    batchIds.push(batchId);
    details.push({
      batchId,
      phase: result.phase,
      ingestedCount: result.ingestedCount,
      acceptedCount: result.acceptedCount,
    });
    const b = bucketPhase(result.phase);
    if (b === "completed") {
      totalCompleted += 1;
    } else if (b === "still_running") {
      totalStillRunning += 1;
    } else {
      totalFailed += 1;
    }
  }

  const remaining = Math.max(0, cap - batchIds.length);
  if (remaining > 0) {
    const { data: ypData, error: ypErr } = await batches
      .select("id")
      .eq("source", "apify_yellow_pages")
      .eq("status", "running")
      .not("external_run_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(remaining);

    if (ypErr) {
      throw new Error(`Liste imports Pages Jaunes : ${ypErr.message}`);
    }

    for (const r of ypData ?? []) {
      const batchId = (r as { id: string }).id;
      const result = await syncYellowPagesApifyImport({ batchId });
      batchIds.push(batchId);
      details.push({
        batchId,
        phase: result.phase,
        ingestedCount: result.ingestedCount,
        acceptedCount: result.acceptedCount,
      });
      const b = bucketPhase(result.phase);
      if (b === "completed") totalCompleted += 1;
      else if (b === "still_running") totalStillRunning += 1;
      else totalFailed += 1;
    }
  }

  const remainingLi = Math.max(0, cap - batchIds.length);
  if (remainingLi > 0) {
    const { data: liData, error: liErr } = await batches
      .select("id")
      .eq("source", "apify_linkedin_enrichment")
      .eq("status", "running")
      .not("external_run_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(remainingLi);

    if (liErr) {
      throw new Error(`Liste enrichissements LinkedIn : ${liErr.message}`);
    }

    for (const r of liData ?? []) {
      const batchId = (r as { id: string }).id;
      const result = await syncLinkedInEnrichmentApifyImport({ batchId });
      batchIds.push(batchId);
      details.push({
        batchId,
        phase: result.phase,
        ingestedCount: result.ingestedCount,
        acceptedCount: result.acceptedCount,
      });
      const b = bucketPhase(result.phase);
      if (b === "completed") totalCompleted += 1;
      else if (b === "still_running") totalStillRunning += 1;
      else totalFailed += 1;
    }
  }

  return {
    totalScanned: batchIds.length,
    totalCompleted,
    totalStillRunning,
    totalFailed,
    batchIds,
    details,
  };
}
