import type { AccessContext } from "@/lib/auth/access-context";
import type { CockpitIsoRange } from "@/features/dashboard/lib/cockpit-period";
import {
  classifyCloserQueue,
  mapWorkflowToCloserQueueItem,
} from "@/features/cee-workflows/lib/closer-workflow-activity";
import { getCloserAvailableSheets } from "@/features/cee-workflows/queries/get-closer-available-sheets";
import { getLeadSheetWorkflowsForAccess } from "@/features/cee-workflows/queries/get-lead-sheet-workflows";

export async function getCloserPendingWorkflows(access: AccessContext) {
  const workflows = await getLeadSheetWorkflowsForAccess(access, {});
  return workflows
    .filter((workflow) => ["to_close", "docs_prepared"].includes(workflow.workflow_status))
    .map(mapWorkflowToCloserQueueItem);
}

export async function getCloserWaitingSignatureWorkflows(access: AccessContext) {
  const workflows = await getLeadSheetWorkflowsForAccess(access, {});
  return workflows
    .filter((workflow) => workflow.workflow_status === "agreement_sent")
    .map(mapWorkflowToCloserQueueItem);
}

export async function getCloserRecentWonLostWorkflows(access: AccessContext) {
  const workflows = await getLeadSheetWorkflowsForAccess(access, {});
  return workflows
    .filter((workflow) => ["agreement_signed", "paid", "lost"].includes(workflow.workflow_status))
    .map(mapWorkflowToCloserQueueItem)
    .slice(0, 12);
}

export async function getCloserDashboardData(
  access: AccessContext,
  workflowCreatedRange?: CockpitIsoRange,
) {
  const [sheets, workflows] = await Promise.all([
    getCloserAvailableSheets(access),
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
    queue: classifyCloserQueue(
      scoped.map(mapWorkflowToCloserQueueItem),
      new Date().toISOString(),
    ),
    workflows: scoped,
  };
}
