import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

/** Ligne batch pour pilotage import (Apify async). */
export type LeadGenerationImportBatchRow = {
  id: string;
  source: string;
  source_label: string | null;
  created_at: string;
  status: string;
  job_reference: string | null;
  external_run_id: string | null;
  external_dataset_id: string | null;
  external_status: string | null;
  ingest_started_at: string | null;
  imported_count: number;
  accepted_count: number;
  duplicate_count: number;
  rejected_count: number;
  error_summary: string | null;
  metadata_json: Record<string, unknown>;
  finished_at: string | null;
  started_at: string | null;
};

export async function getLeadGenerationImportBatchById(
  batchId: string,
): Promise<LeadGenerationImportBatchRow | null> {
  const supabase = await createClient();
  const { data, error } = await lgTable(supabase, "lead_generation_import_batches")
    .select(
      "id, source, source_label, created_at, status, job_reference, external_run_id, external_dataset_id, external_status, ingest_started_at, imported_count, accepted_count, duplicate_count, rejected_count, error_summary, metadata_json, finished_at, started_at",
    )
    .eq("id", batchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data as LeadGenerationImportBatchRow | null;
}
