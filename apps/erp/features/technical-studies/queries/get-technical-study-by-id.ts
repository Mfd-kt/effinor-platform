import { createClient } from "@/lib/supabase/server";

import type { TechnicalStudyDetailRow } from "@/features/technical-studies/types";

export async function getTechnicalStudyById(id: string): Promise<TechnicalStudyDetailRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("technical_studies")
    .select(
      `
      *,
      primary_document:documents!technical_studies_primary_document_id_fkey (
        id,
        document_type,
        document_number
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de charger l’étude technique : ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return data as unknown as TechnicalStudyDetailRow;
}
