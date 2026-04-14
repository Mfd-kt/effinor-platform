"use server";

import { revalidatePath } from "next/cache";

import { updateFromDocumentForm } from "@/features/documents/lib/map-to-db";
import { DocumentUpdatePayloadSchema } from "@/features/documents/schemas/document.schema";
import type { DocumentRow } from "@/features/documents/types";
import { createClient } from "@/lib/supabase/server";

export type UpdateDocumentResult =
  | { ok: true; data: DocumentRow }
  | { ok: false; message: string };

export async function updateDocument(input: unknown): Promise<UpdateDocumentResult> {
  const parsed = DocumentUpdatePayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const { id, ...rest } = parsed.data;
  const patch = updateFromDocumentForm(rest);

  const supabase = await createClient();
  const { data, error } = await supabase.from("documents").update(patch).eq("id", id).select().single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après mise à jour." };
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${id}`);
  return { ok: true, data };
}
