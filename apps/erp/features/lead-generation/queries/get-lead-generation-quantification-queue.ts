import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationStockRow } from "../domain/stock-row";
import { listImportBatchIdsForQuantificationOwner } from "../lib/quantification-batch-ownership";
import type { QuantificationImportBatchScope } from "../lib/quantification-viewer-scope";
import { lgTable } from "../lib/lg-db";

export type LeadGenerationQuantificationListItem = {
  stock: LeadGenerationStockRow;
  cee_sheet_code: string | null;
  /** Auteur de l’import (lot), si renseigné. */
  import_created_by_display: string | null;
  /** Dernière revue manuelle (ex. qualification), si renseigné. */
  qualified_by_display: string | null;
};

/**
 * File quantificateur : `pending` / `to_validate` uniquement — exclut qualified, rejet, doublon, converti,
 * et toute fiche déjà assignée à un commercial (`current_assignment_id` vide). Aligné avec
 * {@link isLeadGenerationStockInQuantificationQueue}.
 *
 * Périmètre `own` : uniquement les fiches dont le lot (`import_batch_id`) a été créé par ce quantificateur
 * (`lead_generation_import_batches.created_by_user_id`). Le hub (`mode: all`) ne filtre pas sur le propriétaire du lot.
 */
export async function getLeadGenerationQuantificationQueue(
  limit = 200,
  batchScope: QuantificationImportBatchScope = { mode: "all" },
): Promise<LeadGenerationQuantificationListItem[]> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  let importBatchIds: string[] | null = null;
  if (batchScope.mode === "own") {
    importBatchIds = await listImportBatchIdsForQuantificationOwner(supabase, batchScope.userId);
    if (importBatchIds.length === 0) {
      return [];
    }
  }

  let q = stock
    .select(
      `
      *,
      reviewer:profiles!manually_reviewed_by_user_id(id, full_name, email),
      import_batch:lead_generation_import_batches!lead_generation_stock_import_batch_id_fkey(
        cee_sheet_code,
        created_by_user_id,
        created_by_profile:profiles!created_by_user_id(id, full_name, email)
      )
    `,
    )
    .in("qualification_status", ["to_validate", "pending"])
    .is("converted_lead_id", null)
    .is("current_assignment_id", null)
    .is("duplicate_of_stock_id", null)
    .in("stock_status", ["new", "ready"]);

  if (importBatchIds) {
    q = q.in("import_batch_id", importBatchIds);
  }

  const { data, error } = await q.order("created_at", { ascending: true }).limit(limit);

  if (error) {
    throw new Error(`File quantification : ${error.message}`);
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const { import_batch: batch, reviewer, ...rest } = row;
    const b = batch as {
      cee_sheet_code: string | null;
      created_by_profile: { full_name: string | null; email: string | null } | null;
    } | null;
    const rev = reviewer as { full_name: string | null; email: string | null } | null;
    const prof = b?.created_by_profile;
    const import_created_by_display =
      prof?.full_name?.trim() || prof?.email?.trim() || null;
    const qualified_by_display = rev?.full_name?.trim() || rev?.email?.trim() || null;
    return {
      stock: rest as LeadGenerationStockRow,
      cee_sheet_code: b?.cee_sheet_code ?? null,
      import_created_by_display,
      qualified_by_display,
    };
  });
}
