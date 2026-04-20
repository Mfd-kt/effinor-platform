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
  cee_sheet_id: string | null;
  cee_sheet_code: string | null;
  target_team_id: string | null;
  created_by_user_id: string | null;
  stock_initial_qualification: string | null;
  /** Jointure `cee_sheets` (affichage libellé, pas seulement l’UUID). */
  cee_sheet_resolved_code: string | null;
  cee_sheet_resolved_label: string | null;
  /** Jointure `cee_sheet_teams`. */
  target_team_resolved_name: string | null;
};

type BatchSelectRow = Omit<
  LeadGenerationImportBatchRow,
  "cee_sheet_resolved_code" | "cee_sheet_resolved_label" | "target_team_resolved_name"
> & {
  sheet_meta: { code: string | null; label: string | null } | { code: string | null; label: string | null }[] | null;
  team_meta: { name: string | null } | { name: string | null }[] | null;
};

function pickEmbeddable<T extends object>(x: T | T[] | null | undefined): T | null {
  if (!x) {
    return null;
  }
  return Array.isArray(x) ? (x[0] as T) ?? null : x;
}

export async function getLeadGenerationImportBatchById(
  batchId: string,
): Promise<LeadGenerationImportBatchRow | null> {
  const supabase = await createClient();
  const { data, error } = await lgTable(supabase, "lead_generation_import_batches")
    .select(
      `
      id,
      source,
      source_label,
      created_at,
      status,
      job_reference,
      external_run_id,
      external_dataset_id,
      external_status,
      ingest_started_at,
      imported_count,
      accepted_count,
      duplicate_count,
      rejected_count,
      error_summary,
      metadata_json,
      finished_at,
      started_at,
      cee_sheet_id,
      cee_sheet_code,
      target_team_id,
      sheet_meta:cee_sheets!cee_sheet_id(code, label),
      team_meta:cee_sheet_teams!target_team_id(name)
    `,
    )
    .eq("id", batchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const raw = data as BatchSelectRow;
  const sm = pickEmbeddable(raw.sheet_meta);
  const tm = pickEmbeddable(raw.team_meta);

  return {
    id: raw.id,
    source: raw.source,
    source_label: raw.source_label,
    created_at: raw.created_at,
    status: raw.status,
    job_reference: raw.job_reference,
    external_run_id: raw.external_run_id,
    external_dataset_id: raw.external_dataset_id,
    external_status: raw.external_status,
    ingest_started_at: raw.ingest_started_at,
    imported_count: raw.imported_count,
    accepted_count: raw.accepted_count,
    duplicate_count: raw.duplicate_count,
    rejected_count: raw.rejected_count,
    error_summary: raw.error_summary,
    metadata_json: raw.metadata_json,
    finished_at: raw.finished_at,
    started_at: raw.started_at,
    cee_sheet_id: raw.cee_sheet_id,
    cee_sheet_code: raw.cee_sheet_code,
    target_team_id: raw.target_team_id,
    created_by_user_id: raw.created_by_user_id ?? null,
    stock_initial_qualification: raw.stock_initial_qualification ?? null,
    cee_sheet_resolved_code: sm?.code?.trim() || null,
    cee_sheet_resolved_label: sm?.label?.trim() || null,
    target_team_resolved_name: tm?.name?.trim() || null,
  };
}
