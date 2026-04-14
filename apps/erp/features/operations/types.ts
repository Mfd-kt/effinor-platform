import type { Database, Json, TechnicalVisitStatus } from "@/types/database.types";

export type OperationRow = Database["public"]["Tables"]["operations"]["Row"];

/** Ligne liste avec nom du bénéficiaire et VT de référence (jointures). */
export type OperationListRow = OperationRow & {
  beneficiary_company_name: string | null;
  reference_vt_reference: string | null;
};

export type BeneficiaryOption = {
  id: string;
  company_name: string;
  /** H1 / H2 / H3 depuis la fiche bénéficiaire ou CP travaux / siège — pour préremplissage CEE. */
  cee_climate_zone?: string | null;
};

export type DelegatorOption = {
  id: string;
  name: string;
  /** Ex. « 0,0073 € par kWhc » — utilisé pour l’estimation € = taux × kWhc. */
  prime_per_kwhc_note?: string | null;
};

export type ProfileOption = {
  id: string;
  label: string;
};

export type LeadOption = {
  id: string;
  company_name: string;
};

export type TechnicalVisitOption = {
  id: string;
  vt_reference: string;
  beneficiary_id: string | null;
  status: TechnicalVisitStatus;
};

/** Fiche CEE du référentiel (sélecteur + calcul kWhc). */
export type CeeSheetOption = {
  id: string;
  code: string;
  label: string;
  calculation_profile: string;
  input_fields: Json;
  calculation_config: Json;
};

export type OperationFormOptions = {
  beneficiaries: BeneficiaryOption[];
  delegators: DelegatorOption[];
  profiles: ProfileOption[];
  leads: LeadOption[];
  technicalVisits: TechnicalVisitOption[];
  ceeSheets: CeeSheetOption[];
};

export type OperationDetailRow = OperationRow & {
  beneficiaries: {
    id: string;
    company_name: string;
  } | null;
  delegators: {
    id: string;
    name: string;
    /** Pour estimer la prime en € si `estimated_prime_amount` est vide. */
    prime_per_kwhc_note: string | null;
  } | null;
  reference_technical_visit: {
    id: string;
    vt_reference: string;
    status: TechnicalVisitStatus;
  } | null;
};
