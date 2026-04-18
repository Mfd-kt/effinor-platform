"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { reviewLeadGenerationStockActionInputSchema } from "../schemas/lead-generation-actions.schema";
import type { ReviewLeadGenerationStockResult } from "../domain/manual-review";
import { reviewLeadGenerationStock } from "../services/review-lead-generation-stock";

export async function reviewLeadGenerationStockAction(
  input: unknown,
): Promise<LeadGenerationActionResult<ReviewLeadGenerationStockResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  const parsed = reviewLeadGenerationStockActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  const out = await reviewLeadGenerationStock({
    ...parsed.data,
    reviewedByUserId: access.userId,
  });
  if (!out.ok) {
    return { ok: false, error: out.error };
  }
  return { ok: true, data: out.data };
}
