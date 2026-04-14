"use server";

import { revalidatePath } from "next/cache";

import { insertFromBeneficiaryForm } from "@/features/beneficiaries/lib/map-to-db";
import { BeneficiaryInsertSchema } from "@/features/beneficiaries/schemas/beneficiary.schema";
import type { BeneficiaryRow } from "@/features/beneficiaries/types";
import { createClient } from "@/lib/supabase/server";

export type CreateBeneficiaryResult =
  | { ok: true; data: BeneficiaryRow }
  | { ok: false; message: string };

export async function createBeneficiary(
  input: unknown,
): Promise<CreateBeneficiaryResult> {
  const parsed = BeneficiaryInsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const supabase = await createClient();
  const row = insertFromBeneficiaryForm(parsed.data);

  const { data, error } = await supabase.from("beneficiaries").insert(row).select().single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après création." };
  }

  revalidatePath("/beneficiaries");
  return { ok: true, data };
}
