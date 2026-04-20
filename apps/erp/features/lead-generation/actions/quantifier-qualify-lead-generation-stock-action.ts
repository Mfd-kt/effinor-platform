"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationQuantification } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import { assertQuantifierMayActOnQuantificationStock } from "../lib/quantification-batch-ownership";
import { evaluateLeadGenerationDispatchQueue } from "../queue/evaluate-dispatch-queue";
import { getLeadGenerationStockById } from "../queries/get-lead-generation-stock-by-id";
import { reviewLeadGenerationStock } from "../services/review-lead-generation-stock";

export type QuantifierQualifyLeadGenerationStockResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function quantifierQualifyLeadGenerationStockAction(
  stockId: string,
): Promise<QuantifierQualifyLeadGenerationStockResult> {
  const id = stockId?.trim();
  if (!id) {
    return { ok: false, message: "Fiche invalide." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationQuantification(access)) {
    return { ok: false, message: "Accès refusé." };
  }

  const detail = await getLeadGenerationStockById(id);
  if (!detail) {
    return { ok: false, message: "Fiche introuvable." };
  }
  const supabase = await createClient();
  const gate = await assertQuantifierMayActOnQuantificationStock(
    supabase,
    access,
    detail.stock,
    detail.import_batch,
  );
  if (!gate.ok) {
    return { ok: false, message: gate.message };
  }

  const res = await reviewLeadGenerationStock({
    stockId: id,
    reviewType: "quantifier_review",
    reviewDecision: "quantifier_qualify",
    reviewNotes: null,
    reviewedByUserId: access.userId,
  });

  if (!res.ok) {
    return { ok: false, message: res.error };
  }

  try {
    await evaluateLeadGenerationDispatchQueue({ stockId: id });
  } catch {
    /* file métier : ne bloque pas la validation */
  }

  revalidatePath("/lead-generation/quantification");
  revalidatePath(`/lead-generation/quantification/${id}`);
  revalidatePath("/lead-generation/stock");

  return { ok: true, message: "Fiche validée." };
}
