"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";

import type { PrepareLeadsResult } from "../domain/main-actions-result";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import { enrichLeadGenerationStockBatch } from "../enrichment/enrich-lead-generation-stock";
import { getLeadGenerationStockIdsNeedingContactImprovement } from "../queries/get-lead-generation-stock-ids-needing-contact-improvement";
import { getReadyStockIdsForCommercialScoreQuick } from "../queries/get-ready-stock-ids-for-commercial-score-quick";
import { evaluateReadyLeadGenerationDispatchQueueQuick } from "../queue/evaluate-dispatch-queue";
import { prepareLeadsActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { recalculateReadyLeadGenerationCommercialScoreQuick } from "../scoring/recalculate-lead-generation-commercial-score-batch";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";

export async function prepareLeadsAction(input: unknown): Promise<LeadGenerationActionResult<PrepareLeadsResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessAdminCeeSheets(access)) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  const parsed = prepareLeadsActionInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const { settings } = await getLeadGenerationSettings();
    const limit = Math.min(100, Math.max(1, settings.mainActionsDefaults.prepare_batch_limit));
    const enrichCap = Math.min(100, limit);

    let improvement_succeeded = 0;
    let improvement_attempted = 0;

    const improveIds = await getLeadGenerationStockIdsNeedingContactImprovement(enrichCap);
    if (improveIds.length > 0) {
      const enriched = await enrichLeadGenerationStockBatch(improveIds);
      improvement_attempted = enriched.processed;
      improvement_succeeded = enriched.successes;
    }

    const readyPeek = await getReadyStockIdsForCommercialScoreQuick(1);
    if (readyPeek.length === 0) {
      return {
        ok: true,
        data: {
          total_scored: 0,
          total_ready_now: 0,
          total_enrich_needed: 0,
          dispatch_evaluated: 0,
          improvement_succeeded,
          improvement_attempted,
        },
      };
    }

    const scored = await recalculateReadyLeadGenerationCommercialScoreQuick({ limit });
    const queue = await evaluateReadyLeadGenerationDispatchQueueQuick({ limit });

    return {
      ok: true,
      data: {
        total_scored: scored.totalScored,
        total_ready_now: queue.dispatchReadyNowCount,
        total_enrich_needed: queue.dispatchEnrichFirstCount,
        dispatch_evaluated: queue.totalSucceeded,
        improvement_succeeded,
        improvement_attempted,
      },
    };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors de la préparation des leads.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
