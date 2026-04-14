"use server";

import { revalidatePath } from "next/cache";

import { updateFromExistingHeatingForm } from "@/features/existing-heating/lib/map-to-db";
import { ExistingHeatingUpdatePayloadSchema } from "@/features/existing-heating/schemas/existing-heating.schema";
import type { ExistingHeatingUnitRow } from "@/features/existing-heating/types";
import { createClient } from "@/lib/supabase/server";

export type UpdateExistingHeatingUnitResult =
  | { ok: true; data: ExistingHeatingUnitRow }
  | { ok: false; message: string };

export async function updateExistingHeatingUnit(
  input: unknown,
): Promise<UpdateExistingHeatingUnitResult> {
  const parsed = ExistingHeatingUpdatePayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const { id, ...rest } = parsed.data;
  const patch = updateFromExistingHeatingForm(rest);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("existing_heating_units")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après mise à jour." };
  }

  revalidatePath("/existing-heating");
  revalidatePath(`/existing-heating/${id}`);
  return { ok: true, data };
}
