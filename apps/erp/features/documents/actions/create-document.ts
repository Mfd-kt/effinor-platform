"use server";

import { revalidatePath } from "next/cache";

import { insertFromDocumentForm } from "@/features/documents/lib/map-to-db";
import { DocumentInsertSchema } from "@/features/documents/schemas/document.schema";
import type { DocumentRow } from "@/features/documents/types";
import { createClient } from "@/lib/supabase/server";

export type CreateDocumentResult =
  | { ok: true; data: DocumentRow }
  | { ok: false; message: string };

export async function createDocument(input: unknown): Promise<CreateDocumentResult> {
  const parsed = DocumentInsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const row = insertFromDocumentForm(parsed.data);
  const supabase = await createClient();

  const { data, error } = await supabase.from("documents").insert(row).select().single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après création." };
  }

  revalidatePath("/documents");
  return { ok: true, data };
}
