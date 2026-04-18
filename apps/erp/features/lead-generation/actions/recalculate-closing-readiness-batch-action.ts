"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";

import { recalculateLeadGenerationClosingReadinessBatch } from "../closing/recalculate-closing-readiness";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import { recalculateClosingReadinessBatchActionInputSchema } from "../schemas/lead-generation-actions.schema";

export async function recalculateClosingReadinessBatchAction(
  input: unknown,
): Promise<LeadGenerationActionResult<{ processed: number; failed: string[] }>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessAdminCeeSheets(access)) {
    return { ok: false, error: "Accès réservé aux utilisateurs autorisés." };
  }

  const parsed = recalculateClosingReadinessBatchActionInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const data = await recalculateLeadGenerationClosingReadinessBatch({
      stockIds: parsed.data.stockIds,
    });
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors du calcul closing.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
