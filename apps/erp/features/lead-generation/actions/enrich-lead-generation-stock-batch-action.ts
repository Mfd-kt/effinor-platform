"use server";

import {
  enrichLeadGenerationStockBatch,
  type EnrichLeadGenerationStockBatchResult,
} from "../enrichment/enrich-lead-generation-stock";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { enrichLeadGenerationStockBatchActionInputSchema } from "../schemas/lead-generation-actions.schema";

export async function enrichLeadGenerationStockBatchAction(
  input: unknown,
): Promise<LeadGenerationActionResult<EnrichLeadGenerationStockBatchResult>> {
  const parsed = enrichLeadGenerationStockBatchActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Liste de fiches invalide." };
  }

  try {
    const data = await enrichLeadGenerationStockBatch(parsed.data.stockIds);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l’enrichissement groupé.";
    return { ok: false, error: message };
  }
}
