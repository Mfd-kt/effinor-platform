"use server";

import { revalidatePath } from "next/cache";

import { insertFromExistingHeatingForm } from "@/features/existing-heating/lib/map-to-db";
import { ExistingHeatingInsertSchema } from "@/features/existing-heating/schemas/existing-heating.schema";
import type { ExistingHeatingUnitRow } from "@/features/existing-heating/types";
import { createClient } from "@/lib/supabase/server";

export type CreateExistingHeatingUnitResult =
  | { ok: true; data: ExistingHeatingUnitRow }
  | { ok: false; message: string };

export async function createExistingHeatingUnit(
  input: unknown,
): Promise<CreateExistingHeatingUnitResult> {
  const parsed = ExistingHeatingInsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const row = insertFromExistingHeatingForm(parsed.data);
  const supabase = await createClient();

  const { data, error } = await supabase.from("existing_heating_units").insert(row).select().single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après création." };
  }

  revalidatePath("/existing-heating");
  return { ok: true, data };
}
