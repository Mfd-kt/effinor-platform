"use server";

import { revalidatePath } from "next/cache";

import { updateFromTechnicalStudyForm } from "@/features/technical-studies/lib/map-to-db";
import { TechnicalStudyUpdatePayloadSchema } from "@/features/technical-studies/schemas/technical-study.schema";
import type { TechnicalStudyRow } from "@/features/technical-studies/types";
import { createClient } from "@/lib/supabase/server";

export type UpdateTechnicalStudyResult =
  | { ok: true; data: TechnicalStudyRow }
  | { ok: false; message: string };

export async function updateTechnicalStudy(input: unknown): Promise<UpdateTechnicalStudyResult> {
  const parsed = TechnicalStudyUpdatePayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const { id, ...rest } = parsed.data;
  const patch = updateFromTechnicalStudyForm(rest);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("technical_studies")
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

  revalidatePath("/technical-studies");
  revalidatePath(`/technical-studies/${id}`);
  return { ok: true, data };
}
