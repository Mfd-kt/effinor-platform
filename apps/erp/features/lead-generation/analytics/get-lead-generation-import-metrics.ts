import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

const RECENT_LIMIT = 10;
const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

type ImportRow = {
  id: string;
  source: string;
  imported_count: number;
  accepted_count: number;
  duplicate_count: number;
  rejected_count: number;
  created_at: string;
  status: string;
};

export type LeadGenerationImportMetrics = {
  totalImports: number;
  importedCount: number;
  acceptedCount: number;
  duplicateCount: number;
  rejectedCount: number;
  importsLast30Days: number;
  bySource: Array<{
    source: string;
    imported: number;
    accepted: number;
    duplicates: number;
    rejected: number;
    convertedToLead: number;
  }>;
  recentImports: ImportRow[];
};

export async function getLeadGenerationImportMetrics(): Promise<LeadGenerationImportMetrics> {
  const supabase = await createClient();
  const imports = lgTable(supabase, "lead_generation_import_batches");
  const stock = lgTable(supabase, "lead_generation_stock");

  const [{ data: rows, error }, { data: recentRows, error: recentErr }, { data: convertedRows, error: convertedErr }] =
    await Promise.all([
      imports.select("id, source, imported_count, accepted_count, duplicate_count, rejected_count, created_at, status"),
      imports
        .select("id, source, imported_count, accepted_count, duplicate_count, rejected_count, created_at, status")
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT),
      stock.select("source").not("converted_lead_id", "is", null),
    ]);

  if (error) throw new Error(`Metrics imports lead-generation: ${error.message}`);
  if (recentErr) throw new Error(`Metrics imports récents lead-generation: ${recentErr.message}`);
  if (convertedErr) throw new Error(`Metrics conversions par source: ${convertedErr.message}`);

  const list = (rows ?? []) as ImportRow[];
  const convertedBySource = new Map<string, number>();
  for (const row of (convertedRows ?? []) as Array<{ source: string }>) {
    convertedBySource.set(row.source, (convertedBySource.get(row.source) ?? 0) + 1);
  }

  const bySource = new Map<
    string,
    { source: string; imported: number; accepted: number; duplicates: number; rejected: number; convertedToLead: number }
  >();
  for (const source of ["apify_google_maps", "csv_manual"]) {
    bySource.set(source, {
      source,
      imported: 0,
      accepted: 0,
      duplicates: 0,
      rejected: 0,
      convertedToLead: convertedBySource.get(source) ?? 0,
    });
  }

  let importedCount = 0;
  let acceptedCount = 0;
  let duplicateCount = 0;
  let rejectedCount = 0;
  let importsLast30Days = 0;
  const now = Date.now();

  for (const row of list) {
    importedCount += row.imported_count ?? 0;
    acceptedCount += row.accepted_count ?? 0;
    duplicateCount += row.duplicate_count ?? 0;
    rejectedCount += row.rejected_count ?? 0;
    if (now - new Date(row.created_at).getTime() <= DAYS_30_MS) {
      importsLast30Days += 1;
    }

    const agg = bySource.get(row.source) ?? {
      source: row.source,
      imported: 0,
      accepted: 0,
      duplicates: 0,
      rejected: 0,
      convertedToLead: convertedBySource.get(row.source) ?? 0,
    };
    agg.imported += row.imported_count ?? 0;
    agg.accepted += row.accepted_count ?? 0;
    agg.duplicates += row.duplicate_count ?? 0;
    agg.rejected += row.rejected_count ?? 0;
    bySource.set(row.source, agg);
  }

  return {
    totalImports: list.length,
    importedCount,
    acceptedCount,
    duplicateCount,
    rejectedCount,
    importsLast30Days,
    bySource: Array.from(bySource.values()).sort((a, b) => b.imported - a.imported),
    recentImports: (recentRows ?? []) as ImportRow[],
  };
}
