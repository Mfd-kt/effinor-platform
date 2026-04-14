"use server";

import { revalidatePath } from "next/cache";

import { insertFromTechnicalStudyForm } from "@/features/technical-studies/lib/map-to-db";
import { TechnicalStudyInsertSchema } from "@/features/technical-studies/schemas/technical-study.schema";
import type { TechnicalStudyRow } from "@/features/technical-studies/types";
import { createClient } from "@/lib/supabase/server";

export type CreateTechnicalStudyResult =
  | { ok: true; data: TechnicalStudyRow }
  | { ok: false; message: string };

export async function createTechnicalStudy(input: unknown): Promise<CreateTechnicalStudyResult> {
  const parsed = TechnicalStudyInsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const row = insertFromTechnicalStudyForm(parsed.data);
  const supabase = await createClient();

  const { data, error } = await supabase.from("technical_studies").insert(row).select().single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après création." };
  }

  revalidatePath("/technical-studies");
  return { ok: true, data };
}
