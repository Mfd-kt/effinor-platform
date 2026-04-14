import type { Database } from "@/types/database.types";

import { datetimeLocalToIso } from "@/lib/utils/datetime";
import type { DocumentInsertInput } from "@/features/documents/schemas/document.schema";

type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];

function trimOrNull(v: string | undefined): string | null {
  if (v === undefined) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function optionalUrlToDb(v: string | undefined): string | null {
  if (v === undefined) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function uuidOrNull(v: string | undefined): string | null {
  if (v === undefined) return null;
  return v;
}

export function insertFromDocumentForm(data: DocumentInsertInput): DocumentInsert {
  return {
    document_type: data.document_type,
    document_subtype: trimOrNull(data.document_subtype),
    version: data.version ?? 1,
    document_status: data.document_status,
    is_required: data.is_required ?? false,
    is_signed_by_client: data.is_signed_by_client ?? false,
    is_signed_by_company: data.is_signed_by_company ?? false,
    is_compliant: data.is_compliant ?? null,
    issued_at: datetimeLocalToIso(data.issued_at),
    signed_at: datetimeLocalToIso(data.signed_at),
    checked_at: datetimeLocalToIso(data.checked_at),
    checked_by_user_id: uuidOrNull(data.checked_by_user_id),
    document_number: trimOrNull(data.document_number),
    document_date: trimOrNull(data.document_date),
    amount_ht: data.amount_ht ?? null,
    amount_ttc: data.amount_ttc ?? null,
    mime_type: trimOrNull(data.mime_type),
    file_size_bytes: data.file_size_bytes ?? null,
    storage_bucket: trimOrNull(data.storage_bucket),
    storage_path: trimOrNull(data.storage_path),
    signed_storage_bucket: trimOrNull(data.signed_storage_bucket),
    signed_storage_path: trimOrNull(data.signed_storage_path),
    signature_provider_url: optionalUrlToDb(data.signature_provider_url),
    internal_comments: trimOrNull(data.internal_comments),
  };
}

export function updateFromDocumentForm(data: DocumentInsertInput): DocumentUpdate {
  const patch: DocumentUpdate = {};

  if (data.document_type !== undefined) patch.document_type = data.document_type;
  if (data.document_subtype !== undefined) patch.document_subtype = trimOrNull(data.document_subtype);
  if (data.version !== undefined) patch.version = data.version;
  if (data.document_status !== undefined) patch.document_status = data.document_status;
  if (data.is_required !== undefined) patch.is_required = data.is_required;
  if (data.is_signed_by_client !== undefined) patch.is_signed_by_client = data.is_signed_by_client;
  if (data.is_signed_by_company !== undefined) {
    patch.is_signed_by_company = data.is_signed_by_company;
  }
  if (data.is_compliant !== undefined) patch.is_compliant = data.is_compliant;
  if (data.issued_at !== undefined) patch.issued_at = datetimeLocalToIso(data.issued_at);
  if (data.signed_at !== undefined) patch.signed_at = datetimeLocalToIso(data.signed_at);
  if (data.checked_at !== undefined) patch.checked_at = datetimeLocalToIso(data.checked_at);
  if (data.checked_by_user_id !== undefined) {
    patch.checked_by_user_id = uuidOrNull(data.checked_by_user_id);
  }
  if (data.document_number !== undefined) patch.document_number = trimOrNull(data.document_number);
  if (data.document_date !== undefined) patch.document_date = trimOrNull(data.document_date);
  if (data.amount_ht !== undefined) patch.amount_ht = data.amount_ht ?? null;
  if (data.amount_ttc !== undefined) patch.amount_ttc = data.amount_ttc ?? null;
  if (data.mime_type !== undefined) patch.mime_type = trimOrNull(data.mime_type);
  if (data.file_size_bytes !== undefined) patch.file_size_bytes = data.file_size_bytes ?? null;
  if (data.storage_bucket !== undefined) patch.storage_bucket = trimOrNull(data.storage_bucket);
  if (data.storage_path !== undefined) patch.storage_path = trimOrNull(data.storage_path);
  if (data.signed_storage_bucket !== undefined) {
    patch.signed_storage_bucket = trimOrNull(data.signed_storage_bucket);
  }
  if (data.signed_storage_path !== undefined) {
    patch.signed_storage_path = trimOrNull(data.signed_storage_path);
  }
  if (data.signature_provider_url !== undefined) {
    patch.signature_provider_url = optionalUrlToDb(data.signature_provider_url);
  }
  if (data.internal_comments !== undefined) patch.internal_comments = trimOrNull(data.internal_comments);

  return patch;
}
