"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import {
  recalculatePremiumReadyStockQuick,
  type RecalculatePremiumReadyStockQuickSummary,
} from "../premium/recalculate-lead-generation-premium-score";
import { recalculatePremiumReadyStockQuickActionInputSchema } from "../schemas/lead-generation-actions.schema";

export async function recalculatePremiumReadyStockQuickAction(
  input: unknown,
): Promise<LeadGenerationActionResult<RecalculatePremiumReadyStockQuickSummary>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessAdminCeeSheets(access)) {
    return { ok: false, error: "Accès réservé aux utilisateurs autorisés." };
  }

  const parsed = recalculatePremiumReadyStockQuickActionInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const data = await recalculatePremiumReadyStockQuick({ limit: parsed.data.limit });
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors du scoring premium rapide.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
