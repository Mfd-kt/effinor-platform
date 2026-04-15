import {
  CEE_WORKFLOW_STATUS_VALUES,
  type CeeWorkflowStatus,
} from "@/features/cee-workflows/domain/constants";
import { canTransitionWorkflowStatus } from "@/features/cee-workflows/domain/transitions";

export function parseWorkflowStatusForTransitions(raw: string): CeeWorkflowStatus | null {
  return (CEE_WORKFLOW_STATUS_VALUES as readonly string[]).includes(raw)
    ? (raw as CeeWorkflowStatus)
    : null;
}

/** Indique si le statut pipeline autorise le rattachement / passage en « visite technique en attente ». */
export function canAdvanceWorkflowToTechnicalVisitPending(status: CeeWorkflowStatus): boolean {
  return canTransitionWorkflowStatus(status, "technical_visit_pending");
}
