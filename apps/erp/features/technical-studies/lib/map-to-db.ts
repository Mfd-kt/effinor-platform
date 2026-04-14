import type { Database } from "@/types/database.types";

import type { TechnicalStudyInsertInput } from "@/features/technical-studies/schemas/technical-study.schema";

type TechnicalStudyInsert = Database["public"]["Tables"]["technical_studies"]["Insert"];
type TechnicalStudyUpdate = Database["public"]["Tables"]["technical_studies"]["Update"];

function trimOrNull(v: string | undefined): string | null {
  if (v === undefined) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function insertFromTechnicalStudyForm(data: TechnicalStudyInsertInput): TechnicalStudyInsert {
  return {
    primary_document_id: data.primary_document_id,
    study_type: data.study_type,
    reference: data.reference.trim(),
    status: data.status,
    study_date: trimOrNull(data.study_date),
    engineering_office: trimOrNull(data.engineering_office),
    summary: trimOrNull(data.summary),
  };
}

export function updateFromTechnicalStudyForm(data: TechnicalStudyInsertInput): TechnicalStudyUpdate {
  const patch: TechnicalStudyUpdate = {};

  if (data.primary_document_id !== undefined) patch.primary_document_id = data.primary_document_id;
  if (data.study_type !== undefined) patch.study_type = data.study_type;
  if (data.reference !== undefined) patch.reference = data.reference.trim();
  if (data.status !== undefined) patch.status = data.status;
  if (data.study_date !== undefined) patch.study_date = trimOrNull(data.study_date);
  if (data.engineering_office !== undefined) {
    patch.engineering_office = trimOrNull(data.engineering_office);
  }
  if (data.summary !== undefined) patch.summary = trimOrNull(data.summary);

  return patch;
}
