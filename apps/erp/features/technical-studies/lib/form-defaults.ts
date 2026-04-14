import type { TechnicalStudyFormInput } from "@/features/technical-studies/schemas/technical-study.schema";
import type { TechnicalStudyDetailRow, TechnicalStudyRow } from "@/features/technical-studies/types";

export const EMPTY_TECHNICAL_STUDY_FORM: TechnicalStudyFormInput = {
  primary_document_id: "",
  study_type: "dimensioning_note",
  reference: "",
  status: "draft",
  study_date: undefined,
  engineering_office: undefined,
  summary: undefined,
};

export function technicalStudyRowToFormValues(
  row: TechnicalStudyRow | TechnicalStudyDetailRow,
): TechnicalStudyFormInput {
  return {
    primary_document_id: row.primary_document_id ?? "",
    study_type: row.study_type,
    reference: row.reference,
    status: row.status,
    study_date: row.study_date ? row.study_date.slice(0, 10) : undefined,
    engineering_office: row.engineering_office ?? undefined,
    summary: row.summary ?? undefined,
  };
}
