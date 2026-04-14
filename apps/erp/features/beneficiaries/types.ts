import type { Database, TechnicalVisitStatus } from "@/types/database.types";

export type BeneficiaryRow = Database["public"]["Tables"]["beneficiaries"]["Row"];

/** Synthèse d’une VT affichée sur la fiche bénéficiaire. */
export type BeneficiaryLinkedTechnicalVisit = {
  id: string;
  vt_reference: string;
  status: TechnicalVisitStatus;
  scheduled_at: string | null;
  performed_at: string | null;
  lead_id: string;
  lead_company_name: string | null;
  technician_label: string | null;
};
