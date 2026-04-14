import { EMPTY_OPERATION_FORM } from "@/features/operations/lib/form-defaults";
import type { OperationInsertInput } from "@/features/operations/schemas/operation.schema";
import type { OperationFormOptions } from "@/features/operations/types";

/** UUID RFC 4122 (versions 1–5). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s.trim());
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) {
    return undefined;
  }
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Préremplissage sûr depuis l’URL : ignore les ids invalides ou incohérents avec les options chargées.
 */
export function buildOperationCreateDefaultsFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  options: OperationFormOptions,
): OperationInsertInput {
  const beneficiaryParam = firstParam(searchParams.beneficiary_id)?.trim();
  const vtParam = firstParam(searchParams.reference_technical_visit_id)?.trim();

  const base: OperationInsertInput = { ...EMPTY_OPERATION_FORM };

  if (!beneficiaryParam || !isUuid(beneficiaryParam)) {
    return base;
  }

  const beneficiaryOk = options.beneficiaries.some((b) => b.id === beneficiaryParam);
  if (!beneficiaryOk) {
    return base;
  }

  base.beneficiary_id = beneficiaryParam;

  if (!vtParam || !isUuid(vtParam)) {
    return base;
  }

  const vt = options.technicalVisits.find(
    (v) => v.id === vtParam && v.beneficiary_id === beneficiaryParam,
  );
  if (vt) {
    base.reference_technical_visit_id = vtParam;
  }

  return base;
}
