"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";
import { lgTable } from "@/features/lead-generation/lib/lg-db";
import { stockIdParamSchema } from "@/features/lead-generation/schemas/lead-generation-actions.schema";
import { removeLeadGenerationStockAndTasks } from "@/features/lead-generation/services/remove-lead-generation-stock-and-tasks";
import { createClient } from "@/lib/supabase/server";

export type DeleteLeadGenerationStockResult = { ok: true } | { ok: false; error: string };

export async function deleteLeadGenerationStockAction(
  input: unknown,
): Promise<DeleteLeadGenerationStockResult> {
  const parsed = stockIdParamSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Identifiant invalide." };
  }
  const { stockId } = parsed.data;

  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès refusé." };
  }

  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const { data: row, error: fetchErr } = await stockTable
    .select("id, converted_lead_id, stock_status")
    .eq("id", stockId)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, error: fetchErr.message };
  }
  if (!row) {
    return { ok: false, error: "Fiche introuvable." };
  }

  const r = row as { id: string; converted_lead_id: string | null; stock_status: string };
  if (r.converted_lead_id || r.stock_status === "converted") {
    return {
      ok: false,
      error:
        "Cette fiche est liée à un prospect CRM : suppression impossible depuis le stock. Traitez la fiche prospect ou déliez-la d’abord.",
    };
  }

  const removed = await removeLeadGenerationStockAndTasks(supabase, stockId);
  if (!removed.ok) {
    return { ok: false, error: removed.message };
  }

  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation/stock");
  revalidatePath("/lead-generation/imports");
  revalidatePath("/lead-generation/my-queue");
  revalidatePath(`/lead-generation/${stockId}`);

  return { ok: true };
}
