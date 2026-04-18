"use server";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { recalculateLeadGenerationCommercialScoreBatchActionInputSchema } from "../schemas/lead-generation-actions.schema";
import {
  recalculateLeadGenerationCommercialScoreBatch,
  type RecalculateLeadGenerationCommercialScoreBatchSummary,
} from "../scoring/recalculate-lead-generation-commercial-score-batch";

export async function recalculateLeadGenerationCommercialScoreBatchAction(
  input: unknown,
): Promise<LeadGenerationActionResult<RecalculateLeadGenerationCommercialScoreBatchSummary>> {
  const parsed = recalculateLeadGenerationCommercialScoreBatchActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Liste de fiches invalide." };
  }

  try {
    const data = await recalculateLeadGenerationCommercialScoreBatch(parsed.data.stockIds);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du recalcul des scores.";
    return { ok: false, error: message };
  }
}
