import { createClient } from "@/lib/supabase/server";

import { syncGoogleMapsApifyImport } from "../apify/sync-google-maps-apify-import";
import type { SyncGoogleMapsApifyImportPhase } from "../apify/types";
import { lgTable } from "../lib/lg-db";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";

const MAX_BATCHES = 10;

function bucketPhase(phase: SyncGoogleMapsApifyImportPhase): "completed" | "still_running" | "failed" {
  if (phase === "completed" || phase === "already_completed") {
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
 * Imports Apify Google Maps encore « running » avec identifiant run externe, traitement séquentiel borné.
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

  const { data, error } = await batches
    .select("id")
    .eq("source", "apify_google_maps")
    .eq("status", "running")
    .not("external_run_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(cap);

  if (error) {
    throw new Error(`Liste imports Apify en attente : ${error.message}`);
  }

  for (const row of data ?? []) {
    const batchId = (row as { id: string }).id;
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

  return {
    totalScanned: batchIds.length,
    totalCompleted,
    totalStillRunning,
    totalFailed,
    batchIds,
    details,
  };
}
