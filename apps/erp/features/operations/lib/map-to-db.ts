import type { Database, Json } from "@/types/database.types";

import { dateInputToIso } from "@/features/operations/lib/datetime";
import type {
  OperationInsertInput,
  OperationUpdateInput,
} from "@/features/operations/schemas/operation.schema";

/** Titre affiché en liste ; sans saisie manuelle : « Opération » + code fiche ou référence dossier. */
export function deriveOperationTitleForInsert(
  data: OperationInsertInput,
  operationReference: string,
): string {
  const manual = data.title?.trim();
  if (manual) return manual;
  const code = data.cee_sheet_code?.trim();
  if (code) return `Opération ${code}`;
  return `Opération ${operationReference}`;
}

type OperationInsert = Database["public"]["Tables"]["operations"]["Insert"];
type OperationUpdate = Database["public"]["Tables"]["operations"]["Update"];

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

export function insertFromOperationForm(
  data: OperationInsertInput,
  operationReference: string,
): OperationInsert {
  const ceeCode = data.cee_sheet_code?.trim() ?? "";
  return {
    operation_reference: operationReference,
    beneficiary_id: data.beneficiary_id,
    lead_id: data.lead_id ?? null,
    reference_technical_visit_id: data.reference_technical_visit_id ?? null,
    cee_sheet_id: data.cee_sheet_id ?? null,
    cee_input_values: (data.cee_input_values ?? {}) as Json,
    cee_kwhc_calculated: data.cee_kwhc_calculated ?? null,
    cee_sheet_code: ceeCode,
    product_family: null,
    title: deriveOperationTitleForInsert(data, operationReference),
    operation_status: data.operation_status,
    sales_status: data.sales_status,
    admin_status: data.admin_status,
    technical_status: data.technical_status,
    delegator_id: data.delegator_id ?? null,
    sales_owner_id: data.sales_owner_id ?? null,
    confirmer_id: data.confirmer_id ?? null,
    admin_owner_id: data.admin_owner_id ?? null,
    technical_owner_id: data.technical_owner_id ?? null,
    technical_visit_date: dateInputToIso(data.technical_visit_date),
    quote_sent_at: dateInputToIso(data.quote_sent_at),
    quote_signed_at: dateInputToIso(data.quote_signed_at),
    installation_start_at: dateInputToIso(data.installation_start_at),
    installation_end_at: dateInputToIso(data.installation_end_at),
    deposit_date: dateInputToIso(data.deposit_date),
    prime_paid_at: dateInputToIso(data.prime_paid_at),
    estimated_quote_amount_ht: data.estimated_quote_amount_ht ?? null,
    estimated_prime_amount: data.estimated_prime_amount ?? null,
    estimated_remaining_cost: data.estimated_remaining_cost ?? null,
    valuation_amount: data.valuation_amount ?? null,
    drive_url: optionalUrlToDb(data.drive_url),
    signature_url: optionalUrlToDb(data.signature_url),
    public_tracking_url: optionalUrlToDb(data.public_tracking_url),
    risk_level: trimOrNull(data.risk_level),
    notes: trimOrNull(data.notes),
  };
}

export function updateFromOperationForm(
  data: Omit<OperationUpdateInput, "id">,
): OperationUpdate {
  const patch: OperationUpdate = {};

  if (data.operation_reference !== undefined) {
    patch.operation_reference = data.operation_reference.trim();
  }
  if (data.beneficiary_id !== undefined) patch.beneficiary_id = data.beneficiary_id;
  if (data.lead_id !== undefined) patch.lead_id = data.lead_id ?? null;
  if (data.reference_technical_visit_id !== undefined) {
    patch.reference_technical_visit_id = data.reference_technical_visit_id ?? null;
  }
  if (data.cee_sheet_id !== undefined) patch.cee_sheet_id = data.cee_sheet_id ?? null;
  if (data.cee_input_values !== undefined) {
    patch.cee_input_values = data.cee_input_values as unknown as Json;
  }
  if (data.cee_kwhc_calculated !== undefined) {
    patch.cee_kwhc_calculated = data.cee_kwhc_calculated ?? null;
  }
  if (data.cee_sheet_code !== undefined) {
    patch.cee_sheet_code = data.cee_sheet_code?.trim() ?? "";
  }
  if (data.title !== undefined) {
    const t = data.title.trim();
    if (t) patch.title = t;
  }
  if (data.operation_status !== undefined) patch.operation_status = data.operation_status;
  if (data.sales_status !== undefined) patch.sales_status = data.sales_status;
  if (data.admin_status !== undefined) patch.admin_status = data.admin_status;
  if (data.technical_status !== undefined) patch.technical_status = data.technical_status;
  if (data.delegator_id !== undefined) patch.delegator_id = data.delegator_id ?? null;
  if (data.sales_owner_id !== undefined) patch.sales_owner_id = data.sales_owner_id ?? null;
  if (data.confirmer_id !== undefined) patch.confirmer_id = data.confirmer_id ?? null;
  if (data.admin_owner_id !== undefined) patch.admin_owner_id = data.admin_owner_id ?? null;
  if (data.technical_owner_id !== undefined) {
    patch.technical_owner_id = data.technical_owner_id ?? null;
  }
  if (data.technical_visit_date !== undefined) {
    patch.technical_visit_date = dateInputToIso(data.technical_visit_date);
  }
  if (data.quote_sent_at !== undefined) {
    patch.quote_sent_at = dateInputToIso(data.quote_sent_at);
  }
  if (data.quote_signed_at !== undefined) {
    patch.quote_signed_at = dateInputToIso(data.quote_signed_at);
  }
  if (data.installation_start_at !== undefined) {
    patch.installation_start_at = dateInputToIso(data.installation_start_at);
  }
  if (data.installation_end_at !== undefined) {
    patch.installation_end_at = dateInputToIso(data.installation_end_at);
  }
  if (data.deposit_date !== undefined) {
    patch.deposit_date = dateInputToIso(data.deposit_date);
  }
  if (data.prime_paid_at !== undefined) {
    patch.prime_paid_at = dateInputToIso(data.prime_paid_at);
  }
  if (data.estimated_quote_amount_ht !== undefined) {
    patch.estimated_quote_amount_ht = data.estimated_quote_amount_ht ?? null;
  }
  if (data.estimated_prime_amount !== undefined) {
    patch.estimated_prime_amount = data.estimated_prime_amount ?? null;
  }
  if (data.estimated_remaining_cost !== undefined) {
    patch.estimated_remaining_cost = data.estimated_remaining_cost ?? null;
  }
  if (data.valuation_amount !== undefined) {
    patch.valuation_amount = data.valuation_amount ?? null;
  }
  if (data.drive_url !== undefined) patch.drive_url = optionalUrlToDb(data.drive_url);
  if (data.signature_url !== undefined) patch.signature_url = optionalUrlToDb(data.signature_url);
  if (data.public_tracking_url !== undefined) {
    patch.public_tracking_url = optionalUrlToDb(data.public_tracking_url);
  }
  if (data.risk_level !== undefined) patch.risk_level = trimOrNull(data.risk_level);
  if (data.notes !== undefined) patch.notes = trimOrNull(data.notes);

  return patch;
}
