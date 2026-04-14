"use server";

import { revalidatePath } from "next/cache";

import { updateFromOperationForm } from "@/features/operations/lib/map-to-db";
import {
  applyCeePatchToOperationUpdate,
  mergeOperationUpdateForCee,
} from "@/features/operations/lib/operation-cee-enrich";
import { OperationUpdateSchema } from "@/features/operations/schemas/operation.schema";
import type { OperationRow } from "@/features/operations/types";
import { createClient } from "@/lib/supabase/server";

export type UpdateOperationResult =
  | { ok: true; data: OperationRow }
  | { ok: false; message: string };

export async function updateOperation(input: unknown): Promise<UpdateOperationResult> {
  const parsed = OperationUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const { id, ...rest } = parsed.data;
  const supabase = await createClient();

  const { data: existing, error: existingErr } = await supabase
    .from("operations")
    .select("cee_sheet_id, cee_input_values, cee_kwhc_calculated, cee_sheet_code")
    .eq("id", id)
    .maybeSingle();

  if (existingErr) {
    return { ok: false, message: existingErr.message };
  }
  if (!existing) {
    return { ok: false, message: "Opération introuvable." };
  }

  const merged = mergeOperationUpdateForCee(rest, existing);
  const patch = updateFromOperationForm(rest);
  const cee = await applyCeePatchToOperationUpdate(supabase, merged, patch);
  if (!cee.ok) {
    return { ok: false, message: cee.message };
  }

  const { data, error } = await supabase
    .from("operations")
    .update(cee.patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après mise à jour." };
  }

  revalidatePath("/operations");
  revalidatePath(`/operations/${id}`);
  return { ok: true, data };
}
