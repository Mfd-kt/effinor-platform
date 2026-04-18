"use server";

import type { LeadGenerationActionResult } from "../lib/action-result";
import type { LeadGenerationStockDetail } from "../queries/get-lead-generation-stock-by-id";
import { getLeadGenerationStockById } from "../queries/get-lead-generation-stock-by-id";
import { stockIdParamSchema } from "../schemas/lead-generation-actions.schema";

export async function getLeadGenerationStockByIdAction(
  input: unknown,
): Promise<LeadGenerationActionResult<LeadGenerationStockDetail | null>> {
  const parsed = stockIdParamSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Identifiant stock invalide." };
  }

  try {
    const data = await getLeadGenerationStockById(parsed.data.stockId);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du chargement de la fiche.";
    return { ok: false, error: message };
  }
}
