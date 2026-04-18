"use server";

import type { DispatchLeadGenerationStockResult } from "../domain/dispatch-result";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { dispatchLeadGenerationStockForAgent } from "../services/dispatch-lead-generation-stock";
import { agentIdParamSchema } from "../schemas/lead-generation-actions.schema";

export async function dispatchLeadGenerationStockForAgentAction(
  input: unknown,
): Promise<LeadGenerationActionResult<DispatchLeadGenerationStockResult>> {
  const parsed = agentIdParamSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Identifiant agent invalide." };
  }

  try {
    const data = await dispatchLeadGenerationStockForAgent(parsed.data.agentId);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du dispatch.";
    return { ok: false, error: message };
  }
}
