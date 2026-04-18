"use server";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { evaluateLeadGenerationDispatchQueueBatchActionInputSchema } from "../schemas/lead-generation-actions.schema";
import {
  evaluateLeadGenerationDispatchQueueBatch,
  type EvaluateLeadGenerationDispatchQueueBatchSummary,
} from "../queue/evaluate-dispatch-queue";

export async function evaluateLeadGenerationDispatchQueueBatchAction(
  input: unknown,
): Promise<LeadGenerationActionResult<EvaluateLeadGenerationDispatchQueueBatchSummary>> {
  const parsed = evaluateLeadGenerationDispatchQueueBatchActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Liste de fiches invalide." };
  }

  try {
    const data = await evaluateLeadGenerationDispatchQueueBatch(parsed.data.stockIds);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l’évaluation du lot.";
    return { ok: false, error: message };
  }
}
