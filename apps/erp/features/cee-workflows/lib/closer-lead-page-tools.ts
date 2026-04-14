import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";

/** Statuts pour lesquels le bloc « Poste closer » est proposé sur la fiche lead. */
export const CLOSER_LEAD_PAGE_TOOL_STATUSES = new Set<string>([
  "docs_prepared",
  "to_close",
  "agreement_sent",
  "agreement_signed",
  "quote_pending",
  "quote_sent",
  "quote_signed",
  "technical_visit_pending",
  "technical_visit_done",
  "installation_pending",
  "cee_deposit_pending",
  "cee_deposited",
  "paid",
  "lost",
]);

export function workflowsEligibleForCloserLeadPageTools(
  workflows: WorkflowScopedListRow[],
): WorkflowScopedListRow[] {
  return workflows.filter((w) => CLOSER_LEAD_PAGE_TOOL_STATUSES.has(w.workflow_status));
}
