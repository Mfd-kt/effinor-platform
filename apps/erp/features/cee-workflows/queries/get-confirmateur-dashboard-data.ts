import type { AccessContext } from "@/lib/auth/access-context";
import type { CockpitIsoRange } from "@/features/dashboard/lib/cockpit-period";
import {
  classifyConfirmateurQueue,
  mapWorkflowToConfirmateurQueueItem,
} from "@/features/cee-workflows/lib/confirmateur-workflow-activity";
import { getConfirmateurAvailableSheets } from "@/features/cee-workflows/queries/get-confirmateur-available-sheets";
import { getLeadSheetWorkflowsForAccess } from "@/features/cee-workflows/queries/get-lead-sheet-workflows";

export async function getConfirmateurPendingWorkflows(access: AccessContext) {
  const workflows = await getLeadSheetWorkflowsForAccess(access, {});
  return workflows
    .filter((workflow) => ["simulation_done", "to_confirm"].includes(workflow.workflow_status))
    .map(mapWorkflowToConfirmateurQueueItem);
}

export async function getConfirmateurRecentQualifiedWorkflows(access: AccessContext) {
  const workflows = await getLeadSheetWorkflowsForAccess(access, {});
  return workflows
    .filter((workflow) => workflow.workflow_status === "qualified")
    .map(mapWorkflowToConfirmateurQueueItem)
    .slice(0, 12);
}

export async function getConfirmateurDashboardData(
  access: AccessContext,
  workflowCreatedRange?: CockpitIsoRange,
) {
  const [sheets, workflows] = await Promise.all([
    getConfirmateurAvailableSheets(access),
    getLeadSheetWorkflowsForAccess(access, {}),
  ]);

  let scoped = workflows;
  if (workflowCreatedRange) {
    scoped = workflows.filter(
      (w) =>
        w.created_at >= workflowCreatedRange.startIso && w.created_at < workflowCreatedRange.endIso,
    );
  }

  return {
    sheets,
    queue: classifyConfirmateurQueue(scoped.map(mapWorkflowToConfirmateurQueueItem)),
    workflows: scoped,
  };
}
