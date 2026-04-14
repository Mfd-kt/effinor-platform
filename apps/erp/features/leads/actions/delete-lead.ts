"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { createClient } from "@/lib/supabase/server";

export type DeleteLeadResult = { ok: true } | { ok: false; message: string };

export async function deleteLead(leadId: string): Promise<DeleteLeadResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, message: "Seul le super administrateur peut supprimer un lead." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("leads")
    .select("id, created_by_agent_id, confirmed_by_user_id")
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, message: fetchError?.message ?? "Lead introuvable." };
  }

  if (!canAccessLeadRow(existing, access)) {
    return { ok: false, message: "Accès refusé à ce lead." };
  }

  const { error } = await supabase
    .from("leads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", leadId)
    .is("deleted_at", null);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/agent");
  revalidatePath("/confirmateur");
  revalidatePath("/closer");
  revalidatePath("/cockpit");
  return { ok: true };
}
