import { createClient } from "@/lib/supabase/server";

import type { OperationStatus, TechnicalVisitStatus } from "@/types/database.types";

export type BeneficiaryOperationVisitRow = {
  id: string;
  vt_reference: string;
  status: TechnicalVisitStatus;
  updated_at: string;
  created_at: string;
};

/** Opération liée au bénéficiaire (liste fiche bénéficiaire). */
export type BeneficiaryLinkedOperation = {
  id: string;
  operation_reference: string;
  title: string;
  /** Code référentiel CEE (ex. fiche sélectionnée ou saisie manuelle). */
  cee_sheet_code: string;
  operation_status: OperationStatus;
  updated_at: string;
};

export type BeneficiaryOperationCreationContext = {
  beneficiary: { id: string; company_name: string };
  technicalVisits: BeneficiaryOperationVisitRow[];
  eligibleTechnicalVisits: BeneficiaryOperationVisitRow[];
  recommendedTechnicalVisitId: string | null;
  flags: {
    noTechnicalVisit: boolean;
    noEligibleTechnicalVisit: boolean;
    multipleEligible: boolean;
  };
  existingOperations: BeneficiaryLinkedOperation[];
};

const EXCLUDED: ReadonlySet<TechnicalVisitStatus> = new Set(["refused", "cancelled"]);

const OTHER_PRIORITY: ReadonlySet<TechnicalVisitStatus> = new Set([
  "report_pending",
  "performed",
  "scheduled",
  "to_schedule",
]);

function compareVisitRecency(a: BeneficiaryOperationVisitRow, b: BeneficiaryOperationVisitRow): number {
  const u = b.updated_at.localeCompare(a.updated_at);
  if (u !== 0) {
    return u;
  }
  return b.created_at.localeCompare(a.created_at);
}

/**
 * Règle métier : VT validée la plus récente ; sinon autre statut « actif » le plus récent.
 * Jamais refused / cancelled.
 */
export function pickRecommendedTechnicalVisitId(
  visits: BeneficiaryOperationVisitRow[],
): string | null {
  const eligible = visits.filter((v) => !EXCLUDED.has(v.status));
  if (eligible.length === 0) {
    return null;
  }

  const validated = eligible.filter((v) => v.status === "validated").sort(compareVisitRecency);
  if (validated.length > 0) {
    return validated[0].id;
  }

  const others = eligible.filter((v) => OTHER_PRIORITY.has(v.status)).sort(compareVisitRecency);
  if (others.length > 0) {
    return others[0].id;
  }

  return eligible.sort(compareVisitRecency)[0]?.id ?? null;
}

/**
 * Contexte pour « Créer une opération » depuis la fiche bénéficiaire (VT de référence recommandée, compteurs).
 */
export async function getBeneficiaryOperationCreationContext(
  beneficiaryId: string,
): Promise<BeneficiaryOperationCreationContext | null> {
  const supabase = await createClient();

  const { data: beneficiary, error: benError } = await supabase
    .from("beneficiaries")
    .select("id, company_name")
    .eq("id", beneficiaryId)
    .is("deleted_at", null)
    .maybeSingle();

  if (benError) {
    throw new Error(`Bénéficiaire : ${benError.message}`);
  }
  if (!beneficiary) {
    return null;
  }

  const { data: visitRows, error: vtError } = await supabase
    .from("technical_visits")
    .select("id, vt_reference, status, updated_at, created_at")
    .eq("beneficiary_id", beneficiaryId)
    .is("deleted_at", null);

  if (vtError) {
    throw new Error(`Visites techniques : ${vtError.message}`);
  }

  const technicalVisits = (visitRows ?? []) as BeneficiaryOperationVisitRow[];
  const eligibleTechnicalVisits = technicalVisits.filter((v) => !EXCLUDED.has(v.status));
  const recommendedTechnicalVisitId = pickRecommendedTechnicalVisitId(technicalVisits);

  const { data: opRows, error: opError } = await supabase
    .from("operations")
    .select("id, operation_reference, title, cee_sheet_code, operation_status, updated_at")
    .eq("beneficiary_id", beneficiaryId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (opError) {
    throw new Error(`Opérations : ${opError.message}`);
  }

  const existingOperations = (opRows ?? []) as BeneficiaryLinkedOperation[];
  const noTechnicalVisit = technicalVisits.length === 0;
  const noEligibleTechnicalVisit = technicalVisits.length > 0 && eligibleTechnicalVisits.length === 0;
  const multipleEligible = eligibleTechnicalVisits.length > 1;

  return {
    beneficiary,
    technicalVisits,
    eligibleTechnicalVisits,
    recommendedTechnicalVisitId,
    flags: {
      noTechnicalVisit,
      noEligibleTechnicalVisit,
      multipleEligible,
    },
    existingOperations,
  };
}
