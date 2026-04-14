import { createClient } from "@/lib/supabase/server";

import type { DocumentFormOptions } from "@/features/documents/types";

/**
 * Listes pour les sélecteurs du formulaire document (référentiel central).
 */
export async function getDocumentFormOptions(): Promise<DocumentFormOptions> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(`Profils : ${error.message}`);
  }

  return {
    profiles: (data ?? []).map((r) => ({
      id: r.id,
      label: r.full_name?.trim() || r.email || r.id,
    })),
  };
}
