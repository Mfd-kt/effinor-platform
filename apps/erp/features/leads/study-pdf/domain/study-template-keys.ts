import type { StudyCeeSolutionKind } from "./types";

/** Clés de gabarit enregistrées (admin `cee_sheets.*_template_key`). */
export const STUDY_PRESENTATION_TEMPLATE_DESTRAT_V1 = "destrat_v1";
export const STUDY_PRESENTATION_TEMPLATE_PAC_V1 = "pac_v1";
export const STUDY_AGREEMENT_TEMPLATE_DESTRAT_V1 = "destrat_v1";
export const STUDY_AGREEMENT_TEMPLATE_PAC_V1 = "pac_v1";

const PRESENTATION_REGISTRY = new Set<string>([
  STUDY_PRESENTATION_TEMPLATE_DESTRAT_V1,
  STUDY_PRESENTATION_TEMPLATE_PAC_V1,
]);

const AGREEMENT_REGISTRY = new Set<string>([
  STUDY_AGREEMENT_TEMPLATE_DESTRAT_V1,
  STUDY_AGREEMENT_TEMPLATE_PAC_V1,
]);

export function normalizePresentationTemplateKey(
  raw: string | null | undefined,
  kind: StudyCeeSolutionKind,
): string {
  const t = raw?.trim();
  if (t && PRESENTATION_REGISTRY.has(t)) return t;
  if (kind === "pac") return STUDY_PRESENTATION_TEMPLATE_PAC_V1;
  return STUDY_PRESENTATION_TEMPLATE_DESTRAT_V1;
}

export function normalizeAgreementTemplateKey(
  raw: string | null | undefined,
  kind: StudyCeeSolutionKind,
): string {
  const t = raw?.trim();
  if (t && AGREEMENT_REGISTRY.has(t)) return t;
  if (kind === "pac") return STUDY_AGREEMENT_TEMPLATE_PAC_V1;
  return STUDY_AGREEMENT_TEMPLATE_DESTRAT_V1;
}
