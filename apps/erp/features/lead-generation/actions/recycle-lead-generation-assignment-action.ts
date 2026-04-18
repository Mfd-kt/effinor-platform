"use server";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { recycleLeadGenerationAssignmentActionInputSchema } from "../schemas/lead-generation-actions.schema";
import {
  recycleLeadGenerationAssignment,
  type RecycleLeadGenerationAssignmentResult,
} from "../recycling/recycle-lead-generation-assignment";

export async function recycleLeadGenerationAssignmentAction(
  input: unknown,
): Promise<LeadGenerationActionResult<RecycleLeadGenerationAssignmentResult>> {
  const parsed = recycleLeadGenerationAssignmentActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const data = await recycleLeadGenerationAssignment({ assignmentId: parsed.data.assignmentId });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du recyclage.";
    return { ok: false, error: message };
  }
}
