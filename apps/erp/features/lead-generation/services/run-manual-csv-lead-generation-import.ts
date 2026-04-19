import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import { mapCsvTextToLeadGenerationRawStockInputs } from "../import-sources/csv";
import { leadGenerationBatchCeeInsertColumns } from "../lib/lead-generation-batch-cee-columns";
import type { LeadGenerationBatchCeeColumns } from "../lib/lead-generation-batch-cee-columns";
import { lgTable } from "../lib/lg-db";
import { ingestLeadGenerationStock } from "./ingest-lead-generation-stock";

export type RunManualCsvLeadGenerationImportInput = {
  csvText: string;
  filename?: string | null;
  sourceLabel?: string | null;
  cee: LeadGenerationBatchCeeColumns;
};

export type ManualCsvLeadGenerationImportResult =
  | {
      ok: true;
      batchId: string;
      importedCount: number;
      acceptedCount: number;
      duplicateCount: number;
      rejectedCount: number;
      status: "completed";
      skippedEmptyCompany: number;
    }
  | {
      ok: false;
      batchId?: string;
      message: string;
      importedCount?: number;
      acceptedCount?: number;
      duplicateCount?: number;
      rejectedCount?: number;
      status: "failed";
      skippedEmptyCompany?: number;
    };

async function markBatchFailed(
  batchId: string,
  message: string,
  metadataPatch: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const finishedAt = new Date().toISOString();
  const { data: row } = await batches.select("metadata_json").eq("id", batchId).maybeSingle();
  const prev = (row as { metadata_json?: Json } | null)?.metadata_json;
  const meta =
    prev && typeof prev === "object" && !Array.isArray(prev)
      ? { ...(prev as Record<string, unknown>), ...metadataPatch }
      : metadataPatch;

  await batches
    .update({
      status: "failed",
      finished_at: finishedAt,
      error_summary: message.slice(0, 2000),
      metadata_json: meta as unknown as Json,
    })
    .eq("id", batchId);
}

/**
 * Import CSV manuel : batch `csv_manual`, parsing, mapping, puis `ingestLeadGenerationStock`.
 */
export async function runManualCsvLeadGenerationImport(
  input: RunManualCsvLeadGenerationImportInput,
): Promise<ManualCsvLeadGenerationImportResult> {
  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const now = new Date().toISOString();

  const sourceLabel = input.sourceLabel?.trim() || "Import CSV manuel";
  const baseMetadata: Record<string, unknown> = {
    import_kind: "csv_manual",
    ...(input.filename?.trim() ? { filename: input.filename.trim() } : {}),
  };

  const ceeCols = leadGenerationBatchCeeInsertColumns(input.cee);

  const { data: inserted, error: insErr } = await batches
    .insert({
      source: "csv_manual",
      source_label: sourceLabel,
      status: "running",
      started_at: now,
      metadata_json: baseMetadata as unknown as Json,
      ...ceeCols,
    } as never)
    .select("id")
    .single();

  if (insErr || !inserted) {
    return {
      ok: false,
      status: "failed",
      message: insErr?.message ?? "Création du batch impossible.",
    };
  }

  const batchId = (inserted as { id: string }).id;

  try {
    const { rows, skippedEmptyCompany, headerKeys } = mapCsvTextToLeadGenerationRawStockInputs(
      input.csvText,
      "csv_manual",
    );

    await batches
      .update({
        metadata_json: { ...baseMetadata, header_keys: headerKeys, skipped_empty_company: skippedEmptyCompany } as unknown as Json,
      })
      .eq("id", batchId);

    if (rows.length === 0) {
      const msg =
        skippedEmptyCompany > 0
          ? "Aucune ligne avec une raison sociale : vérifiez les en-têtes (ex. company_name) et le contenu."
          : "Aucune ligne de données après l’en-tête.";
      await markBatchFailed(batchId, msg, { parse_ok: true, header_keys: headerKeys });
      return {
        ok: false,
        batchId,
        status: "failed",
        message: msg,
        skippedEmptyCompany,
      };
    }

    const ingest = await ingestLeadGenerationStock(batchId, rows);

    if (!ingest.ok) {
      await markBatchFailed(batchId, ingest.message, {
        ingest_error: true,
        skipped_empty_company: skippedEmptyCompany,
      });
      const s = ingest.summary;
      return {
        ok: false,
        batchId,
        status: "failed",
        message: ingest.message,
        importedCount: s?.imported_count,
        acceptedCount: s?.accepted_count,
        duplicateCount: s?.duplicate_count,
        rejectedCount: s?.rejected_count,
        skippedEmptyCompany,
      };
    }

    return {
      ok: true,
      batchId,
      importedCount: ingest.summary.imported_count,
      acceptedCount: ingest.summary.accepted_count,
      duplicateCount: ingest.summary.duplicate_count,
      rejectedCount: ingest.summary.rejected_count,
      status: "completed",
      skippedEmptyCompany,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inattendue lors de l’import CSV.";
    await markBatchFailed(batchId, message, { exception: true });
    return {
      ok: false,
      batchId,
      status: "failed",
      message,
    };
  }
}
