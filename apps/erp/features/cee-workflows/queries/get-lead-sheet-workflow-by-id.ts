import type { AccessContext } from "@/lib/auth/access-context";
import { getLeadSheetWorkflowsForAccess } from "@/features/cee-workflows/queries/get-lead-sheet-workflows";
import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";

export async function getLeadSheetWorkflowById(
  workflowId: string,
  access: AccessContext,
): Promise<WorkflowScopedListRow | null> {
  if (access.kind !== "authenticated") {
    return null;
  }

  const workflows = await getLeadSheetWorkflowsForAccess(access, { includeArchived: true });
  const workflow = workflows.find((row) => row.id === workflowId);
  if (workflow) {
    return workflow;
  }
  return null;
}
