import type { Database } from "@/types/database.types";

import type {
  BeneficiaryInsertInput,
  BeneficiaryUpdateInput,
} from "@/features/beneficiaries/schemas/beneficiary.schema";

type BeneficiaryInsert = Database["public"]["Tables"]["beneficiaries"]["Insert"];
type BeneficiaryUpdate = Database["public"]["Tables"]["beneficiaries"]["Update"];

function trimOrNull(v: string | undefined): string | null {
  if (v === undefined) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function trimOptionalToNull(v: string | undefined): string | null {
  if (v === undefined) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function insertFromBeneficiaryForm(data: BeneficiaryInsertInput): BeneficiaryInsert {
  return {
    company_name: data.company_name.trim(),
    siren: trimOrNull(data.siren),
    siret_head_office: trimOrNull(data.siret_head_office),
    siret_worksite: trimOrNull(data.siret_worksite),
    civility: trimOrNull(data.civility),
    contact_first_name: trimOrNull(data.contact_first_name),
    contact_last_name: trimOrNull(data.contact_last_name),
    contact_role: trimOrNull(data.contact_role),
    phone: trimOrNull(data.phone),
    landline: trimOrNull(data.landline),
    email: data.email?.trim() ? data.email.trim() : null,
    head_office_address: trimOrNull(data.head_office_address),
    head_office_postal_code: trimOrNull(data.head_office_postal_code),
    head_office_city: trimOrNull(data.head_office_city),
    worksite_address: trimOrNull(data.worksite_address),
    worksite_postal_code: trimOrNull(data.worksite_postal_code),
    worksite_city: trimOrNull(data.worksite_city),
    climate_zone: trimOrNull(data.climate_zone),
    region: trimOrNull(data.region),
    acquisition_source: trimOrNull(data.acquisition_source),
    status: data.status,
    notes: trimOrNull(data.notes),
  };
}

export function updateFromBeneficiaryForm(
  data: Omit<BeneficiaryUpdateInput, "id">,
): BeneficiaryUpdate {
  const patch: BeneficiaryUpdate = {};

  if (data.company_name !== undefined) {
    patch.company_name = data.company_name.trim();
  }
  if (data.siren !== undefined) patch.siren = trimOrNull(data.siren);
  if (data.siret_head_office !== undefined) {
    patch.siret_head_office = trimOrNull(data.siret_head_office);
  }
  if (data.siret_worksite !== undefined) {
    patch.siret_worksite = trimOrNull(data.siret_worksite);
  }
  if (data.civility !== undefined) patch.civility = trimOrNull(data.civility);
  if (data.contact_first_name !== undefined) {
    patch.contact_first_name = trimOrNull(data.contact_first_name);
  }
  if (data.contact_last_name !== undefined) {
    patch.contact_last_name = trimOrNull(data.contact_last_name);
  }
  if (data.contact_role !== undefined) patch.contact_role = trimOrNull(data.contact_role);
  if (data.phone !== undefined) patch.phone = trimOrNull(data.phone);
  if (data.landline !== undefined) patch.landline = trimOrNull(data.landline);
  if (data.email !== undefined) {
    patch.email = data.email?.trim() ? data.email.trim() : null;
  }
  if (data.head_office_address !== undefined) {
    patch.head_office_address = trimOrNull(data.head_office_address);
  }
  if (data.head_office_postal_code !== undefined) {
    patch.head_office_postal_code = trimOrNull(data.head_office_postal_code);
  }
  if (data.head_office_city !== undefined) {
    patch.head_office_city = trimOrNull(data.head_office_city);
  }
  if (data.worksite_address !== undefined) {
    patch.worksite_address = trimOrNull(data.worksite_address);
  }
  if (data.worksite_postal_code !== undefined) {
    patch.worksite_postal_code = trimOrNull(data.worksite_postal_code);
  }
  if (data.worksite_city !== undefined) patch.worksite_city = trimOrNull(data.worksite_city);
  if (data.climate_zone !== undefined) patch.climate_zone = trimOrNull(data.climate_zone);
  if (data.region !== undefined) patch.region = trimOrNull(data.region);
  if (data.acquisition_source !== undefined) {
    patch.acquisition_source = trimOrNull(data.acquisition_source);
  }
  if (data.status !== undefined) patch.status = data.status;
  if (data.notes !== undefined) patch.notes = trimOptionalToNull(data.notes);

  return patch;
}
