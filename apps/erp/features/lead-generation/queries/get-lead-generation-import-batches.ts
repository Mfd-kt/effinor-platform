import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

export type GetLeadGenerationImportBatchesFilters = {
  source?: string;
  status?: string;
  external_status?: string;
};

export type GetLeadGenerationImportBatchesParams = {
  filters?: GetLeadGenerationImportBatchesFilters;
  limit?: number;
  offset?: number;
};

/** Ligne liste pour l’écran imports (sans jointure). */
export type LeadGenerationImportBatchListItem = {
  id: string;
  source: string;
  source_label: string | null;
  status: string;
  external_status: string | null;
  external_run_id: string | null;
  external_dataset_id: string | null;
  imported_count: number;
  accepted_count: number;
  duplicate_count: number;
  rejected_count: number;
  error_summary: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  cee_sheet_id: string | null;
  cee_sheet_code: string | null;
  target_team_id: string | null;
  target_team_name: string | null;
};

const LIST_SELECT =
  "id, source, source_label, status, external_status, external_run_id, external_dataset_id, imported_count, accepted_count, duplicate_count, rejected_count, error_summary, created_at, started_at, finished_at, cee_sheet_id, cee_sheet_code, target_team_id";

/**
 * Liste les batches d’import avec filtres optionnels et pagination (tri `created_at` desc).
 */
export async function getLeadGenerationImportBatches(
  params?: GetLeadGenerationImportBatchesParams,
): Promise<LeadGenerationImportBatchListItem[]> {
  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");

  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  const f = params?.filters;

  let q = batches.select(LIST_SELECT).order("created_at", { ascending: false });

  if (f?.source?.trim()) {
    q = q.eq("source", f.source.trim());
  }
  if (f?.status?.trim()) {
    q = q.eq("status", f.status.trim());
  }
  if (f?.external_status?.trim()) {
    q = q.eq("external_status", f.external_status.trim());
  }

  const { data, error } = await q.range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Liste imports lead generation : ${error.message}`);
  }

  const rows = (data ?? []) as Omit<LeadGenerationImportBatchListItem, "target_team_name">[];
  const teamIds = [...new Set(rows.map((r) => r.target_team_id).filter((id): id is string => !!id?.trim()))];
  let teamNameById = new Map<string, string>();
  if (teamIds.length > 0) {
    const { data: teams, error: teamErr } = await supabase
      .from("cee_sheet_teams")
      .select("id, name")
      .in("id", teamIds);
    if (teamErr) {
      throw new Error(teamErr.message);
    }
    teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name?.trim() || t.id] as const));
  }

  return rows.map((r) => ({
    ...r,
    target_team_name: r.target_team_id ? (teamNameById.get(r.target_team_id) ?? null) : null,
  }));
}
