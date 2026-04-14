import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

export type LeadWorkflowActivityEventRow = {
  id: string;
  lead_sheet_workflow_id: string;
  event_type: string;
  event_label: string;
  payload_json: Json;
  created_at: string;
  created_by_profile: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
};

/**
 * Événements d’activité (transitions, envois, etc.) pour tous les workflows CEE d’un lead.
 */
export async function getLeadWorkflowActivityEvents(
  workflowIds: string[],
): Promise<LeadWorkflowActivityEventRow[]> {
  if (workflowIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_sheet_workflow_events")
    .select(
      "id, lead_sheet_workflow_id, event_type, event_label, payload_json, created_at, created_by_profile:profiles!created_by_user_id(id, full_name, email)",
    )
    .in("lead_sheet_workflow_id", workflowIds)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as LeadWorkflowActivityEventRow[];
}
