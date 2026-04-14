import type { Database } from "@/types/database.types";

export type TechnicalStudyRow = Database["public"]["Tables"]["technical_studies"]["Row"];

export type TechnicalStudyListRow = TechnicalStudyRow & {
  primary_document_label: string | null;
};

export type DocumentOption = {
  id: string;
  document_type: string;
  document_number: string | null;
};

export type TechnicalStudyFormOptions = {
  documents: DocumentOption[];
};

export type TechnicalStudyDetailRow = TechnicalStudyRow & {
  primary_document: {
    id: string;
    document_type: string;
    document_number: string | null;
  } | null;
};
