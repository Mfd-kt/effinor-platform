import { createClient } from "@/lib/supabase/server";

import type { TechnicalStudyFormOptions } from "@/features/technical-studies/types";

/**
 * Documents du référentiel central pour rattacher une étude.
 */
export async function getTechnicalStudyFormOptions(): Promise<TechnicalStudyFormOptions> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, document_type, document_number")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw new Error(`Documents : ${error.message}`);
  }

  const documents = (data ?? []).map((r) => ({
    id: r.id,
    document_type: r.document_type,
    document_number: r.document_number,
  }));

  return { documents };
}
