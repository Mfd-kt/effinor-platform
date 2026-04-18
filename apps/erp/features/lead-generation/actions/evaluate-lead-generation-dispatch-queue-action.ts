"use server";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { stockIdParamSchema } from "../schemas/lead-generation-actions.schema";
import type { LeadGenerationDispatchQueueDecision } from "../queue/compute-lead-generation-dispatch-queue";
import { evaluateLeadGenerationDispatchQueue } from "../queue/evaluate-dispatch-queue";

export async function evaluateLeadGenerationDispatchQueueAction(
  input: unknown,
): Promise<LeadGenerationActionResult<LeadGenerationDispatchQueueDecision>> {
  const parsed = stockIdParamSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Identifiant invalide." };
  }

  try {
    const { decision } = await evaluateLeadGenerationDispatchQueue({ stockId: parsed.data.stockId });
    return { ok: true, data: decision };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l’évaluation de la file.";
    return { ok: false, error: message };
  }
}
