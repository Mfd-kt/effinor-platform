"use server";

import type { ConvertLeadGenerationAssignmentResult } from "../domain/convert-assignment-result";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { convertAssignmentParamSchema } from "../schemas/lead-generation-actions.schema";
import { convertLeadGenerationAssignmentToLead } from "../services/convert-lead-generation-assignment-to-lead";

export async function convertLeadGenerationAssignmentToLeadAction(
  input: unknown,
): Promise<LeadGenerationActionResult<ConvertLeadGenerationAssignmentResult>> {
  const parsed = convertAssignmentParamSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres de conversion invalides." };
  }

  try {
    const data = await convertLeadGenerationAssignmentToLead({
      assignmentId: parsed.data.assignmentId,
      agentId: parsed.data.agentId,
    });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de la conversion.";
    return { ok: false, error: message };
  }
}
