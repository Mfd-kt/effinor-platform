import type { CloserWorkflowDetail } from "@/features/cee-workflows/queries/get-closer-workflow-detail";
import type { SaveCloserNotesInput } from "@/features/cee-workflows/schemas/closer-workspace.schema";

export function closerNotesDefaultsFromDetail(
  detail: CloserWorkflowDetail | null,
): Omit<SaveCloserNotesInput, "workflowId"> {
  const raw = detail?.workflow.qualification_data_json;
  const src =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  return {
    closer_notes:
      typeof src.closer_notes === "string" ? src.closer_notes : detail?.workflow.closer_notes ?? null,
    objection_code: typeof src.objection_code === "string" ? src.objection_code : null,
    objection_detail: typeof src.objection_detail === "string" ? src.objection_detail : null,
    last_contact_at: typeof src.last_contact_at === "string" ? src.last_contact_at : null,
    next_follow_up_at: typeof src.next_follow_up_at === "string" ? src.next_follow_up_at : null,
    call_outcome: typeof src.call_outcome === "string" ? src.call_outcome : null,
    loss_reason: typeof src.loss_reason === "string" ? src.loss_reason : null,
  };
}
