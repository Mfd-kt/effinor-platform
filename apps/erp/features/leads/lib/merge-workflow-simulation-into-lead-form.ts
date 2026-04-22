// TODO: cee-workflows / simulator retiré — la fusion d'un workflow CEE dans le formulaire lead
// est désactivée. Les utilitaires conservent leur signature mais retournent des valeurs neutres.

import type { LeadFormInput } from "@/features/leads/schemas/lead.schema";

export function isWorkflowQualificationDataEmpty(raw: unknown): boolean {
  if (raw == null) return true;
  if (typeof raw !== "object" || Array.isArray(raw)) return true;
  return Object.keys(raw as object).length === 0;
}

export function simulationResultHasData(json: unknown): boolean {
  if (json == null) return false;
  if (typeof json !== "object" || Array.isArray(json)) return false;
  return Object.keys(json as object).length > 0;
}

export function mergeLeadFormDefaultsFromWorkflowSimulation(
  base: LeadFormInput,
  _workflow: any,
): LeadFormInput {
  return base;
}
