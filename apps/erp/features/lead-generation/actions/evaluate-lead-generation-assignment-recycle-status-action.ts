"use server";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { evaluateLeadGenerationAssignmentRecycleStatusActionInputSchema } from "../schemas/lead-generation-actions.schema";
import {
  evaluateLeadGenerationAssignmentRecycleStatus,
  type EvaluateRecycleStatusResult,
} from "../recycling/evaluate-recycle-status";

export async function evaluateLeadGenerationAssignmentRecycleStatusAction(
  input: unknown,
): Promise<LeadGenerationActionResult<EvaluateRecycleStatusResult>> {
  const parsed = evaluateLeadGenerationAssignmentRecycleStatusActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const data = await evaluateLeadGenerationAssignmentRecycleStatus({ assignmentId: parsed.data.assignmentId });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l’évaluation.";
    return { ok: false, error: message };
  }
}
