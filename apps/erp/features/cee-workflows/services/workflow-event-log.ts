import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import type { CeeSheetWorkflowRow, CeeSheetWorkflowUpdate, WorkflowEventInput } from "@/features/cee-workflows/types";

type Supabase = SupabaseClient<Database>;

export type WorkflowEventLogInsert = Database["public"]["Tables"]["workflow_event_logs"]["Insert"];

/** Insert structuré — levée d’erreur si la ligne n’est pas persistée. */
export async function logWorkflowEvent(supabase: Supabase, row: WorkflowEventLogInsert): Promise<void> {
  const { error } = await supabase.from("workflow_event_logs").insert(row);
  if (error) {
    throw new Error(`workflow_event_logs: ${error.message}`);
  }
}

function mapAppEventToStructuredType(appEventType: string): WorkflowEventLogInsert["event_type"] {
  switch (appEventType) {
    case "sent_to_confirmateur":
      return "sent_to_confirmateur";
    case "sent_to_closer":
      return "sent_to_closer";
    case "workflow_qualified":
      return "qualified";
    case "workflow_lost":
      return "closed";
    case "agreement_signed":
      return "converted";
    default:
      return "status_changed";
  }
}

/**
 * Journal V3 : une ligne par transition de statut, ou par changement d’affectation (batch assignments_updated).
 */
export async function appendWorkflowStructuredLogs(
  supabase: Supabase,
  before: CeeSheetWorkflowRow,
  after: CeeSheetWorkflowRow,
  patch: CeeSheetWorkflowUpdate,
  event: Omit<WorkflowEventInput, "workflowId">,
): Promise<void> {
  const leadId = after.lead_id;
  const wfId = after.id;
  const actor = event.createdByUserId ?? null;

  if (event.eventType === "assignments_updated") {
    if (
      patch.assigned_agent_user_id !== undefined &&
      patch.assigned_agent_user_id !== before.assigned_agent_user_id
    ) {
      await logWorkflowEvent(supabase, {
        workflow_id: wfId,
        lead_id: leadId,
        from_status: before.workflow_status,
        to_status: after.workflow_status,
        event_type: "assigned_agent",
        actor_user_id: actor,
      });
    }
    if (
      patch.assigned_confirmateur_user_id !== undefined &&
      patch.assigned_confirmateur_user_id !== before.assigned_confirmateur_user_id
    ) {
      await logWorkflowEvent(supabase, {
        workflow_id: wfId,
        lead_id: leadId,
        from_status: before.workflow_status,
        to_status: after.workflow_status,
        event_type: "assigned_confirmateur",
        actor_user_id: actor,
      });
    }
    if (
      patch.assigned_closer_user_id !== undefined &&
      patch.assigned_closer_user_id !== before.assigned_closer_user_id
    ) {
      await logWorkflowEvent(supabase, {
        workflow_id: wfId,
        lead_id: leadId,
        from_status: before.workflow_status,
        to_status: after.workflow_status,
        event_type: "assigned_closer",
        actor_user_id: actor,
      });
    }
    return;
  }

  const statusChanged =
    patch.workflow_status !== undefined && patch.workflow_status !== before.workflow_status;
  if (!statusChanged) {
    return;
  }

  const eventType = mapAppEventToStructuredType(event.eventType);
  await logWorkflowEvent(supabase, {
    workflow_id: wfId,
    lead_id: leadId,
    from_status: before.workflow_status,
    to_status: after.workflow_status,
    event_type: eventType,
    actor_user_id: actor,
  });
}

export async function logWorkflowCreated(
  supabase: Supabase,
  input: {
    workflow: CeeSheetWorkflowRow;
    actorUserId?: string | null;
  },
): Promise<void> {
  await logWorkflowEvent(supabase, {
    workflow_id: input.workflow.id,
    lead_id: input.workflow.lead_id,
    from_status: null,
    to_status: input.workflow.workflow_status,
    event_type: "created",
    actor_user_id: input.actorUserId ?? null,
  });
}
