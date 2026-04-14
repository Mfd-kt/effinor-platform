"use server";

import { revalidatePath } from "next/cache";

import { insertFromOperationSiteForm } from "@/features/operation-sites/lib/map-to-db";
import { OperationSiteInsertSchema } from "@/features/operation-sites/schemas/operation-site.schema";
import type { OperationSiteRow } from "@/features/operation-sites/types";
import { createClient } from "@/lib/supabase/server";

export type CreateOperationSiteResult =
  | { ok: true; data: OperationSiteRow }
  | { ok: false; message: string };

export async function createOperationSite(input: unknown): Promise<CreateOperationSiteResult> {
  const parsed = OperationSiteInsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const row = insertFromOperationSiteForm(parsed.data);
  const supabase = await createClient();

  const { data, error } = await supabase.from("operation_sites").insert(row).select().single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après création." };
  }

  revalidatePath("/operation-sites");
  return { ok: true, data };
}
