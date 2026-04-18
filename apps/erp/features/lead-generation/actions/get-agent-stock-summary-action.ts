"use server";

import type { AgentStockSummary } from "../domain/agent-stock-summary";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { getAgentStockSummary } from "../queries/get-agent-stock-summary";
import { agentIdParamSchema } from "../schemas/lead-generation-actions.schema";

export async function getAgentStockSummaryAction(
  input: unknown,
): Promise<LeadGenerationActionResult<AgentStockSummary>> {
  const parsed = agentIdParamSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Identifiant agent invalide." };
  }

  try {
    const data = await getAgentStockSummary(parsed.data.agentId);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du résumé agent.";
    return { ok: false, error: message };
  }
}
