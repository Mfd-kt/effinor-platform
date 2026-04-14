import type { CockpitAiActionType } from "@/features/cockpit/types";

/** Actions pouvant être exécutées automatiquement par l’orchestrateur (V1). */
export const ORCHESTRATOR_AUTO_ACTION_TYPES = new Set<CockpitAiActionType>([
  "notify_user",
  "assign_workflow",
  "reschedule_callback",
]);

/** Interdit en exécution auto (même si présent dans un moteur par erreur). */
export const ORCHESTRATOR_FORBIDDEN_ACTION_TYPES = new Set<CockpitAiActionType>([
  "convert_callback",
  "call_callback",
  "open_lead",
  "fix_sheet",
  "view_automation",
]);

export function isOrchestratorAutoActionAllowed(actionType: CockpitAiActionType): boolean {
  if (ORCHESTRATOR_FORBIDDEN_ACTION_TYPES.has(actionType)) return false;
  return ORCHESTRATOR_AUTO_ACTION_TYPES.has(actionType);
}
