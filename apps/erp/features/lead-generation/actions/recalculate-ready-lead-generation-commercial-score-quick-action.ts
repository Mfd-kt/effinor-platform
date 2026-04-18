"use server";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import { recalculateReadyLeadGenerationCommercialScoreQuickActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";
import {
  recalculateReadyLeadGenerationCommercialScoreQuick,
  type RecalculateLeadGenerationCommercialScoreBatchSummary,
} from "../scoring/recalculate-lead-generation-commercial-score-batch";

export async function recalculateReadyLeadGenerationCommercialScoreQuickAction(
  input: unknown,
): Promise<LeadGenerationActionResult<RecalculateLeadGenerationCommercialScoreBatchSummary>> {
  const parsed = recalculateReadyLeadGenerationCommercialScoreQuickActionInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const { settings } = await getLeadGenerationSettings();
    const limit = Math.max(1, parsed.data.limit ?? settings.uiBatchLimits.quick_score_limit);
    const data = await recalculateReadyLeadGenerationCommercialScoreQuick({ limit });
    if (data.totalRequested === 0) {
      return { ok: false, error: "Aucune donnée à traiter." };
    }
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors du scoring rapide.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
