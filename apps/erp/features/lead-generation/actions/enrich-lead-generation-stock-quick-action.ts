"use server";

import {
  enrichLeadGenerationStockQuick,
  type EnrichLeadGenerationStockBatchResult,
} from "../enrichment/enrich-lead-generation-stock";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";
import { enrichLeadGenerationStockQuickActionInputSchema } from "../schemas/lead-generation-actions.schema";

export async function enrichLeadGenerationStockQuickAction(
  input: unknown,
): Promise<LeadGenerationActionResult<EnrichLeadGenerationStockBatchResult>> {
  const parsed = enrichLeadGenerationStockQuickActionInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const { settings } = await getLeadGenerationSettings();
    const limit = Math.max(1, parsed.data.limit ?? settings.uiBatchLimits.quick_enrichment_limit);
    const data = await enrichLeadGenerationStockQuick(limit);
    if (data.processed === 0) {
      return { ok: false, error: "Aucune donnée à traiter." };
    }
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors de l’enrichissement rapide.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
