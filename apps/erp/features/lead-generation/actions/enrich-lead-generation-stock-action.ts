"use server";

import {
  enrichLeadGenerationStock,
  type EnrichLeadGenerationStockResult,
} from "../enrichment/enrich-lead-generation-stock";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { stockIdParamSchema } from "../schemas/lead-generation-actions.schema";

export async function enrichLeadGenerationStockAction(
  input: unknown,
): Promise<LeadGenerationActionResult<EnrichLeadGenerationStockResult>> {
  const parsed = stockIdParamSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Identifiant fiche invalide." };
  }

  try {
    const data = await enrichLeadGenerationStock({ stockId: parsed.data.stockId });
    if (data.status === "failed" && data.error) {
      return { ok: false, error: data.error };
    }
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l’enrichissement.";
    return { ok: false, error: message };
  }
}
