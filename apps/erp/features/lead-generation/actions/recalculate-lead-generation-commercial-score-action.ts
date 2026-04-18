"use server";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { stockIdParamSchema } from "../schemas/lead-generation-actions.schema";
import {
  recalculateLeadGenerationCommercialScore,
  type RecalculateLeadGenerationCommercialScoreResult,
} from "../scoring/recalculate-lead-generation-commercial-score";

export async function recalculateLeadGenerationCommercialScoreAction(
  input: unknown,
): Promise<LeadGenerationActionResult<RecalculateLeadGenerationCommercialScoreResult>> {
  const parsed = stockIdParamSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Identifiant fiche invalide." };
  }

  try {
    const data = await recalculateLeadGenerationCommercialScore(parsed.data.stockId);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du calcul du score commercial.";
    return { ok: false, error: message };
  }
}
