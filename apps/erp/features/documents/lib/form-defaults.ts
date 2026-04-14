import { isoToDatetimeLocal } from "@/lib/utils/datetime";
import type { DocumentFormInput } from "@/features/documents/schemas/document.schema";
import type { DocumentDetailRow, DocumentRow } from "@/features/documents/types";

function triStateFromDb(v: boolean | null | undefined): "" | "true" | "false" {
  if (v === null || v === undefined) return "";
  return v ? "true" : "false";
}

export const EMPTY_DOCUMENT_FORM: DocumentFormInput = {
  document_type: "other",
  document_subtype: undefined,
  version: 1,
  document_status: "draft",
  is_required: false,
  is_signed_by_client: false,
  is_signed_by_company: false,
  is_compliant: "",
  issued_at: undefined,
  signed_at: undefined,
  checked_at: undefined,
  checked_by_user_id: undefined,
  document_number: undefined,
  document_date: undefined,
  amount_ht: undefined,
  amount_ttc: undefined,
  mime_type: undefined,
  file_size_bytes: undefined,
  storage_bucket: undefined,
  storage_path: undefined,
  signed_storage_bucket: undefined,
  signed_storage_path: undefined,
  signature_provider_url: undefined,
  internal_comments: undefined,
};

export function documentRowToFormValues(row: DocumentRow | DocumentDetailRow): DocumentFormInput {
  return {
    document_type: row.document_type,
    document_subtype: row.document_subtype ?? undefined,
    version: row.version,
    document_status: row.document_status,
    is_required: row.is_required,
    is_signed_by_client: row.is_signed_by_client,
    is_signed_by_company: row.is_signed_by_company,
    is_compliant: triStateFromDb(row.is_compliant),
    issued_at: isoToDatetimeLocal(row.issued_at),
    signed_at: isoToDatetimeLocal(row.signed_at),
    checked_at: isoToDatetimeLocal(row.checked_at),
    checked_by_user_id: row.checked_by_user_id ?? undefined,
    document_number: row.document_number ?? undefined,
    document_date: row.document_date ? row.document_date.slice(0, 10) : undefined,
    amount_ht: row.amount_ht ?? undefined,
    amount_ttc: row.amount_ttc ?? undefined,
    mime_type: row.mime_type ?? undefined,
    file_size_bytes: row.file_size_bytes ?? undefined,
    storage_bucket: row.storage_bucket ?? undefined,
    storage_path: row.storage_path ?? undefined,
    signed_storage_bucket: row.signed_storage_bucket ?? undefined,
    signed_storage_path: row.signed_storage_path ?? undefined,
    signature_provider_url: row.signature_provider_url ?? undefined,
    internal_comments: row.internal_comments ?? undefined,
  };
}
