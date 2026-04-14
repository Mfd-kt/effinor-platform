import { createClient } from "@/lib/supabase/server";

import type { DocumentDetailRow } from "@/features/documents/types";

export async function getDocumentById(id: string): Promise<DocumentDetailRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      checked_by_profile:profiles ( id, full_name, email )
    `,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de charger le document : ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return data as unknown as DocumentDetailRow;
}
