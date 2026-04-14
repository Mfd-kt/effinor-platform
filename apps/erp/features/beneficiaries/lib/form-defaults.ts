import type { BeneficiaryInsertInput } from "@/features/beneficiaries/schemas/beneficiary.schema";
import type { BeneficiaryRow } from "@/features/beneficiaries/types";

export const EMPTY_BENEFICIARY_FORM: BeneficiaryInsertInput = {
  company_name: "",
  siren: undefined,
  siret_head_office: undefined,
  siret_worksite: undefined,
  civility: undefined,
  contact_first_name: undefined,
  contact_last_name: undefined,
  contact_role: undefined,
  phone: undefined,
  landline: undefined,
  email: undefined,
  head_office_address: undefined,
  head_office_postal_code: undefined,
  head_office_city: undefined,
  worksite_address: undefined,
  worksite_postal_code: undefined,
  worksite_city: undefined,
  climate_zone: undefined,
  region: undefined,
  acquisition_source: undefined,
  status: "prospect",
  notes: undefined,
};

export function beneficiaryRowToFormValues(row: BeneficiaryRow): BeneficiaryInsertInput {
  return {
    company_name: row.company_name,
    siren: row.siren ?? undefined,
    siret_head_office: row.siret_head_office ?? undefined,
    siret_worksite: row.siret_worksite ?? undefined,
    civility: row.civility ?? undefined,
    contact_first_name: row.contact_first_name ?? undefined,
    contact_last_name: row.contact_last_name ?? undefined,
    contact_role: row.contact_role ?? undefined,
    phone: row.phone ?? undefined,
    landline: row.landline ?? undefined,
    email: row.email ?? undefined,
    head_office_address: row.head_office_address ?? undefined,
    head_office_postal_code: row.head_office_postal_code ?? undefined,
    head_office_city: row.head_office_city ?? undefined,
    worksite_address: row.worksite_address ?? undefined,
    worksite_postal_code: row.worksite_postal_code ?? undefined,
    worksite_city: row.worksite_city ?? undefined,
    climate_zone: row.climate_zone ?? undefined,
    region: row.region ?? undefined,
    acquisition_source: row.acquisition_source ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
  };
}
