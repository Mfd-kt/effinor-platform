import { createClient } from "@/lib/supabase/server";

import type { DocumentListRow, DocumentRow } from "@/features/documents/types";
import type { DocumentStatus, DocumentType } from "@/types/database.types";

export type DocumentListFilters = {
  q?: string;
  document_type?: DocumentType;
  document_status?: DocumentStatus;
};

export async function getDocuments(filters?: DocumentListFilters): Promise<DocumentListRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("documents")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters?.document_type) {
    query = query.eq("document_type", filters.document_type);
  }

  if (filters?.document_status) {
    query = query.eq("document_status", filters.document_status);
  }

  if (filters?.q?.trim()) {
    const raw = filters.q.trim().replace(/,/g, " ");
    const term = `%${raw}%`;
    query = query.or(
      `document_subtype.ilike.${term},document_number.ilike.${term},internal_comments.ilike.${term},mime_type.ilike.${term}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible de charger les documents : ${error.message}`);
  }

  return (data as DocumentRow[] | null) ?? [];
}
