"use server";

import { revalidatePath } from "next/cache";

import { updateFromOperationSiteForm } from "@/features/operation-sites/lib/map-to-db";
import { OperationSiteUpdatePayloadSchema } from "@/features/operation-sites/schemas/operation-site.schema";
import type { OperationSiteRow } from "@/features/operation-sites/types";
import { createClient } from "@/lib/supabase/server";

export type UpdateOperationSiteResult =
  | { ok: true; data: OperationSiteRow }
  | { ok: false; message: string };

export async function updateOperationSite(input: unknown): Promise<UpdateOperationSiteResult> {
  const parsed = OperationSiteUpdatePayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const { id, ...rest } = parsed.data;
  const patch = updateFromOperationSiteForm(rest);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operation_sites")
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

  revalidatePath("/operation-sites");
  revalidatePath(`/operation-sites/${id}`);
  return { ok: true, data };
}
