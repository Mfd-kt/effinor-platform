"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import { recalculateLeadGenerationClosingReadinessBatch } from "../closing/recalculate-closing-readiness";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import { getLeadGenerationStockIdsForClosingRecalcQuick } from "../queries/get-lead-generation-stock-ids-for-closing-recalc-quick";
import { recalculateClosingReadyStockQuickActionInputSchema } from "../schemas/lead-generation-actions.schema";

export async function recalculateClosingReadyStockQuickAction(
  input: unknown,
): Promise<LeadGenerationActionResult<{ processed: number; failed: string[]; selected: number }>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès réservé aux utilisateurs autorisés." };
  }

  const parsed = recalculateClosingReadyStockQuickActionInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const ids = await getLeadGenerationStockIdsForClosingRecalcQuick({ limit: parsed.data.limit });
    const data = await recalculateLeadGenerationClosingReadinessBatch({ stockIds: ids });
    return { ok: true, data: { ...data, selected: ids.length } };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors du calcul closing rapide.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
