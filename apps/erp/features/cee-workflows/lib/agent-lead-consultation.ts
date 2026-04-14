import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";

/** Statuts où l’agent peut encore modifier le lead / workflow depuis son poste. */
export const AGENT_EDITABLE_WORKFLOW_STATUS_SET = new Set(["draft", "simulation_done"]);

export function isWorkflowLockedForAgentEdit(workflowStatus: string): boolean {
  return !AGENT_EDITABLE_WORKFLOW_STATUS_SET.has(workflowStatus);
}

/** Workflow principal pour savoir si la fiche est encore « côté agent ». */
export function resolvePrimaryWorkflowForLead(
  currentWorkflowId: string | null,
  workflows: WorkflowScopedListRow[],
): WorkflowScopedListRow | null {
  if (workflows.length === 0) return null;
  if (currentWorkflowId) {
    const found = workflows.find((w) => w.id === currentWorkflowId);
    if (found) return found;
  }
  return workflows[0] ?? null;
}

export function isLeadReadOnlyForRestrictedAgent(
  currentWorkflowId: string | null,
  workflows: WorkflowScopedListRow[],
): boolean {
  const wf = resolvePrimaryWorkflowForLead(currentWorkflowId, workflows);
  if (!wf) return false;
  return isWorkflowLockedForAgentEdit(wf.workflow_status);
}
