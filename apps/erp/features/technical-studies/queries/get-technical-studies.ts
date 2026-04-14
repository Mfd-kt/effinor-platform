import { createClient } from "@/lib/supabase/server";

import { DOCUMENT_TYPE_LABELS } from "@/features/documents/constants";
import type { TechnicalStudyListRow, TechnicalStudyRow } from "@/features/technical-studies/types";
import type { DocumentType, StudyType, TechnicalStudyStatus } from "@/types/database.types";

export type TechnicalStudyListFilters = {
  q?: string;
  study_type?: StudyType;
  status?: TechnicalStudyStatus;
};

type RawDoc = { document_type: string; document_number: string | null } | null;

type RawRow = TechnicalStudyRow & {
  primary_document: RawDoc;
};

function docLabel(doc: RawDoc): string | null {
  if (!doc) return null;
  const typeLabel =
    doc.document_type in DOCUMENT_TYPE_LABELS
      ? DOCUMENT_TYPE_LABELS[doc.document_type as DocumentType]
      : doc.document_type;
  const num = doc.document_number?.trim();
  return num ? `${typeLabel} · ${num}` : typeLabel;
}

function normalize(raw: RawRow): TechnicalStudyListRow {
  const { primary_document, ...rest } = raw;
  return {
    ...rest,
    primary_document_label: docLabel(primary_document),
  };
}

export async function getTechnicalStudies(
  filters?: TechnicalStudyListFilters,
): Promise<TechnicalStudyListRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("technical_studies")
    .select(
      `
      *,
      primary_document:documents!technical_studies_primary_document_id_fkey (
        document_type,
        document_number
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (filters?.study_type) {
    query = query.eq("study_type", filters.study_type);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.q?.trim()) {
    const raw = filters.q.trim().replace(/,/g, " ");
    const term = `%${raw}%`;
    query = query.or(
      `reference.ilike.${term},engineering_office.ilike.${term},summary.ilike.${term}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible de charger les études techniques : ${error.message}`);
  }

  return (data as unknown as RawRow[] | null)?.map(normalize) ?? [];
}
