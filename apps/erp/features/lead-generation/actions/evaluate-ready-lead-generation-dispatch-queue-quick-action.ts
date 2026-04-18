"use server";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import { evaluateReadyLeadGenerationDispatchQueueQuickActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";
import {
  evaluateReadyLeadGenerationDispatchQueueQuick,
  type EvaluateLeadGenerationDispatchQueueBatchSummary,
} from "../queue/evaluate-dispatch-queue";

export async function evaluateReadyLeadGenerationDispatchQueueQuickAction(
  input: unknown,
): Promise<LeadGenerationActionResult<EvaluateLeadGenerationDispatchQueueBatchSummary>> {
  const parsed = evaluateReadyLeadGenerationDispatchQueueQuickActionInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const { settings } = await getLeadGenerationSettings();
    const limit = Math.max(1, parsed.data.limit ?? settings.uiBatchLimits.quick_dispatch_queue_limit);
    const data = await evaluateReadyLeadGenerationDispatchQueueQuick({ limit });
    if (data.totalRequested === 0) {
      return { ok: false, error: "Aucune donnée à traiter." };
    }
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors de l’évaluation rapide.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
