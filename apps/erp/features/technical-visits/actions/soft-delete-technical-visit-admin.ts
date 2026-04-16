"use server";

import { revalidatePath } from "next/cache";

import { canAdminSoftDeleteTechnicalVisit } from "@/features/technical-visits/access/admin-technical-visit-delete";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

export async function softDeleteTechnicalVisitAdminAction(
  visitId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const id = visitId?.trim();
  if (!id) {
    return { ok: false, message: "Identifiant de visite manquant." };
  }

  const access = await getAccessContext();
  if (!canAdminSoftDeleteTechnicalVisit(access)) {
    return { ok: false, message: "Action réservée aux administrateurs." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("technical_visits")
    .select("id, lead_id, deleted_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, message: fetchErr.message };
  }
  if (!row) {
    return { ok: false, message: "Visite technique introuvable." };
  }

  const { error: delErr } = await supabase
    .from("technical_visits")
    .delete()
    .eq("id", id);

  if (delErr) {
    return { ok: false, message: delErr.message };
  }

  revalidatePath("/technical-visits");
  revalidatePath(`/technical-visits/${id}`);
  if (row.lead_id) {
    revalidatePath("/leads");
    revalidatePath(`/leads/${row.lead_id}`);
  }
  revalidatePath("/confirmateur");

  return { ok: true };
}
