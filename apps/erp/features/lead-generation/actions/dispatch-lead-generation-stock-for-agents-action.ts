"use server";

import type { DispatchLeadGenerationStockForAgentsResult } from "../domain/dispatch-result";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { dispatchLeadGenerationStockForAgents } from "../services/dispatch-lead-generation-stock";
import { agentIdsParamSchema } from "../schemas/lead-generation-actions.schema";

export async function dispatchLeadGenerationStockForAgentsAction(
  input: unknown,
): Promise<LeadGenerationActionResult<DispatchLeadGenerationStockForAgentsResult>> {
  const parsed = agentIdsParamSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Liste d’agents invalide." };
  }

  try {
    const data = await dispatchLeadGenerationStockForAgents(parsed.data.agentIds);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du dispatch multi-agents.";
    return { ok: false, error: message };
  }
}
