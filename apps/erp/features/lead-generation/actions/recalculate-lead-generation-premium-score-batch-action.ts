"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import {
  recalculateLeadGenerationPremiumScoreBatch,
  type RecalculateLeadGenerationPremiumScoreBatchSummary,
} from "../premium/recalculate-lead-generation-premium-score";
import { recalculateLeadGenerationPremiumScoreBatchActionInputSchema } from "../schemas/lead-generation-actions.schema";

export async function recalculateLeadGenerationPremiumScoreBatchAction(
  input: unknown,
): Promise<LeadGenerationActionResult<RecalculateLeadGenerationPremiumScoreBatchSummary>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès réservé aux utilisateurs autorisés." };
  }

  const parsed = recalculateLeadGenerationPremiumScoreBatchActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Liste de fiches invalide." };
  }

  try {
    const data = await recalculateLeadGenerationPremiumScoreBatch({ stockIds: parsed.data.stockIds });
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors du calcul des scores premium.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
