import { createClient } from "@/lib/supabase/server";

import { ingestLeadGenerationStock } from "../services/ingest-lead-generation-stock";
import type { LeadGenerationRawStockInput } from "../domain/raw-input";
import {
  CSV_MANUAL_MAX_ROWS,
  CSV_MANUAL_SOURCE_CODE,
  CSV_MANUAL_SOURCE_LABEL,
} from "./config";
import { buildHeaderMapping, mapCsvRowToStockInput } from "./map-csv-row";
import { parseCsv } from "./parse-csv";

export type StartCsvImportInput = {
  label: string;
  fileName: string;
  csvText: string;
};

export type StartCsvImportResult =
  | {
      ok: true;
      batchId: string;
      summary: {
        totalLines: number;
        mapped: number;
        rejectedMapping: number;
        accepted: number;
        duplicates: number;
        rejectedIngest: number;
        unknownColumns: string[];
      };
    }
  | { ok: false; error: string };

/**
 * Orchestration complète d'un import CSV manuel :
 *  1. Parse du texte CSV + détection délimiteur
 *  2. Mapping des en-têtes vers les champs canoniques ERP
 *  3. Création du batch dans `lead_generation_import_batches` (status=pending)
 *  4. Ingestion via `ingestLeadGenerationStock` (dédup + insertion stock)
 *  5. Si aucune ligne mappable → batch marqué `failed` avec `error_summary`.
 *
 * Les fiches insérées atterrissent avec `qualification_status = 'to_validate'`
 * (imposé par `ingestLeadGenerationStock`) et partent dans le pipeline de
 * dispatch classique après validation quantificateur.
 */
export async function startCsvImport(
  input: StartCsvImportInput,
  ctx: { userId: string }
): Promise<StartCsvImportResult> {
  const label = input.label.trim();
  if (!label) {
    return { ok: false, error: "Nom de l'import obligatoire." };
  }
  if (label.length > 120) {
    return { ok: false, error: "Nom de l'import trop long (120 caractères max)." };
  }

  const parsed = parseCsv(input.csvText);
  if (parsed.rows.length === 0) {
    return {
      ok: false,
      error: "CSV vide ou invalide : aucune ligne de données détectée.",
    };
  }
  if (parsed.rows.length > CSV_MANUAL_MAX_ROWS) {
    return {
      ok: false,
      error: `CSV trop volumineux (${parsed.rows.length} lignes). Maximum autorisé : ${CSV_MANUAL_MAX_ROWS}.`,
    };
  }

  const { canonicalByColumn, unknownColumns } = buildHeaderMapping(parsed.headers);
  if (!Array.from(canonicalByColumn.values()).includes("telephone")) {
    return {
      ok: false,
      error:
        "Colonne `telephone` introuvable dans le CSV. En-têtes acceptés : telephone, téléphone, phone, tel, mobile…",
    };
  }

  const supabase = await createClient();

  // Création du batch avant toute ingestion pour pouvoir y rattacher les lignes.
  const batchRef = `csv-${Date.now().toString(36)}`;
  const { data: batch, error: batchErr } = await supabase
    .from("lead_generation_import_batches")
    .insert({
      source: CSV_MANUAL_SOURCE_CODE,
      source_label: label,
      status: "pending",
      job_reference: batchRef,
      created_by_user_id: ctx.userId,
      metadata_json: {
        triggered_by_user_id: ctx.userId,
        input_source: "csv_upload",
        file_name: input.fileName,
        csv_delimiter: parsed.delimiter,
        csv_total_lines: parsed.totalLines,
        csv_data_rows: parsed.rows.length,
        csv_unknown_columns: unknownColumns,
        label,
      },
    })
    .select("id")
    .single();

  if (batchErr || !batch) {
    return {
      ok: false,
      error: `Impossible de créer le batch : ${batchErr?.message ?? "inconnu"}`,
    };
  }

  // Mapping ligne par ligne. Les lignes non mappables (telephone manquant) sont
  // comptées dans `rejectedMapping` et n'atteignent pas la table stock.
  const mapped: LeadGenerationRawStockInput[] = [];
  let rejectedMapping = 0;

  parsed.rows.forEach((row, idx) => {
    const result = mapCsvRowToStockInput(row, canonicalByColumn, batchRef, idx + 1);
    if (result.ok) {
      mapped.push(result.row);
    } else {
      rejectedMapping += 1;
    }
  });

  if (mapped.length === 0) {
    const errorSummary = `Aucune ligne valide à importer (${rejectedMapping} rejetées au mapping : téléphone manquant).`;
    await supabase
      .from("lead_generation_import_batches")
      .update({
        status: "failed",
        imported_count: parsed.rows.length,
        rejected_count: rejectedMapping,
        finished_at: new Date().toISOString(),
        error_summary: errorSummary,
      })
      .eq("id", batch.id);
    return { ok: false, error: errorSummary };
  }

  const ingest = await ingestLeadGenerationStock(batch.id, mapped, {
    finalizeBatch: true,
  });

  if (!ingest.ok) {
    const message = ingest.message ?? "Échec de l'ingestion.";
    await supabase
      .from("lead_generation_import_batches")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_summary: message.slice(0, 500),
      })
      .eq("id", batch.id);
    return { ok: false, error: message };
  }

  const summary = ingest.summary;
  // Les compteurs côté batch sont déjà mis à jour par `ingestLeadGenerationStock`.
  // On consolide juste `imported_count` (= total parsé, inclut les rejets de mapping)
  // et `rejected_count` (ingest + mapping) pour rester cohérent dans l'UI.
  const finalRejected = summary.rejected_count + rejectedMapping;
  await supabase
    .from("lead_generation_import_batches")
    .update({
      imported_count: parsed.rows.length,
      rejected_count: finalRejected,
    })
    .eq("id", batch.id);

  return {
    ok: true,
    batchId: batch.id,
    summary: {
      totalLines: parsed.rows.length,
      mapped: mapped.length,
      rejectedMapping,
      accepted: summary.accepted_count,
      duplicates: summary.duplicate_count,
      rejectedIngest: summary.rejected_count,
      unknownColumns,
    },
  };
}

// Évite une unused-warning si le label n'est pas référencé ailleurs.
void CSV_MANUAL_SOURCE_LABEL;
