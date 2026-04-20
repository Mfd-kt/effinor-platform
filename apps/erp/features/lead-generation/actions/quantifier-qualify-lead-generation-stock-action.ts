"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationQuantification } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import { assertQuantifierMayActOnQuantificationStock } from "../lib/quantification-batch-ownership";
import { resolveNextQuantificationStockId } from "../lib/resolve-next-quantification-stock-id";
import { evaluateLeadGenerationDispatchQueue } from "../queue/evaluate-dispatch-queue";
import { getLeadGenerationStockById } from "../queries/get-lead-generation-stock-by-id";
import { reviewLeadGenerationStock } from "../services/review-lead-generation-stock";

const MAX_QUALIFIER_COMMENT_LEN = 4000;

export type QuantifierQualifyLeadGenerationStockResult =
  | { ok: true; message: string; nextStockId: string | null }
  | { ok: false; message: string };

export async function quantifierQualifyLeadGenerationStockAction(
  stockId: string,
  options?: { comment?: string | null },
): Promise<QuantifierQualifyLeadGenerationStockResult> {
  const id = stockId?.trim();
  if (!id) {
    return { ok: false, message: "Fiche invalide." };
  }

  const commentRaw = options?.comment?.trim() ?? "";
  if (commentRaw.length > MAX_QUALIFIER_COMMENT_LEN) {
    return {
      ok: false,
      message: `Commentaire trop long (maximum ${MAX_QUALIFIER_COMMENT_LEN} caractères).`,
    };
  }
  const reviewNotes = commentRaw.length > 0 ? commentRaw : null;

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

  const nextStockId = await resolveNextQuantificationStockId(access, id);

  const res = await reviewLeadGenerationStock({
    stockId: id,
    reviewType: "quantifier_review",
    reviewDecision: "quantifier_qualify",
    reviewNotes,
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

  return { ok: true, message: "Fiche validée.", nextStockId };
}
