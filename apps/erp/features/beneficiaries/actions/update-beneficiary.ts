"use server";

import { revalidatePath } from "next/cache";

import { updateFromBeneficiaryForm } from "@/features/beneficiaries/lib/map-to-db";
import { BeneficiaryUpdateSchema } from "@/features/beneficiaries/schemas/beneficiary.schema";
import type { BeneficiaryRow } from "@/features/beneficiaries/types";
import { createClient } from "@/lib/supabase/server";

export type UpdateBeneficiaryResult =
  | { ok: true; data: BeneficiaryRow }
  | { ok: false; message: string };

export async function updateBeneficiary(
  input: unknown,
): Promise<UpdateBeneficiaryResult> {
  const parsed = BeneficiaryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const { id, ...rest } = parsed.data;
  const patch = updateFromBeneficiaryForm(rest);

  if (Object.keys(patch).length === 0) {
    const supabase = await createClient();
    const { data: existing, error: fetchError } = await supabase
      .from("beneficiaries")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError || !existing) {
      return { ok: false, message: fetchError?.message ?? "Bénéficiaire introuvable." };
    }
    return { ok: true, data: existing };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("beneficiaries")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Bénéficiaire introuvable ou déjà supprimé." };
  }

  revalidatePath("/beneficiaries");
  revalidatePath(`/beneficiaries/${id}`);
  return { ok: true, data };
}
