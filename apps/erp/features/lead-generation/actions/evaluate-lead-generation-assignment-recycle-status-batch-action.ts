"use server";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { evaluateLeadGenerationAssignmentRecycleStatusBatchActionInputSchema } from "../schemas/lead-generation-actions.schema";
import {
  evaluateLeadGenerationAssignmentRecycleStatusBatch,
  type EvaluateRecycleBatchSummary,
} from "../recycling/evaluate-recycle-status";

export async function evaluateLeadGenerationAssignmentRecycleStatusBatchAction(
  input: unknown,
): Promise<LeadGenerationActionResult<EvaluateRecycleBatchSummary>> {
  const parsed = evaluateLeadGenerationAssignmentRecycleStatusBatchActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Liste invalide." };
  }

  try {
    const data = await evaluateLeadGenerationAssignmentRecycleStatusBatch(parsed.data.assignmentIds);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du lot.";
    return { ok: false, error: message };
  }
}
