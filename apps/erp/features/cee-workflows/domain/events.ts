import type { Database, Json } from "@/types/database.types";

export function buildWorkflowEventInsert(input: {
  workflowId: string;
  eventType: string;
  eventLabel: string;
  payloadJson?: Json;
  createdByUserId?: string | null;
}): Database["public"]["Tables"]["lead_sheet_workflow_events"]["Insert"] {
  return {
    lead_sheet_workflow_id: input.workflowId,
    event_type: input.eventType,
    event_label: input.eventLabel,
    payload_json: input.payloadJson ?? {},
    created_by_user_id: input.createdByUserId ?? null,
  };
}
