// TODO: cee-workflows retiré — l'éligibilité workflow → visite technique est neutralisée.
// La signature est conservée pour ne pas casser les appelants.

export function parseWorkflowStatusForTransitions(raw: string): string | null {
  return raw?.trim() ? raw : null;
}

export function canAdvanceWorkflowToTechnicalVisitPending(_status: string): boolean {
  return true;
}
