import type { AccessContext } from "@/lib/auth/access-context";
import { getLeadById } from "@/features/leads/queries/get-lead-by-id";
import { getLeadEmails } from "@/features/leads/queries/get-lead-emails";
import { getLeadStudyDocuments } from "@/features/leads/study-pdf/queries/get-lead-study-documents";
import { getEmailTrackingForLead } from "@/features/leads/study-pdf/queries/get-email-tracking";
import { queryCartById } from "@/features/products/queries/get-cart";
import { createClient } from "@/lib/supabase/server";
import type { CartWithItems } from "@/features/products/domain/types";
import type { LeadDetailRow } from "@/features/leads/types";
import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";

export type CloserWorkflowDetail = {
  workflow: WorkflowScopedListRow;
  /** Lead complet (même source que la fiche `/leads/[id]`), si les droits le permettent. */
  leadDetail: LeadDetailRow | null;
  events: Array<{
    id: string;
    event_type: string;
    event_label: string;
    payload_json: unknown;
    created_at: string;
    created_by_profile: {
      id: string;
      full_name: string | null;
      email: string;
    } | null;
  }>;
  leadDocuments: Awaited<ReturnType<typeof getLeadStudyDocuments>>;
  leadEmails: Awaited<ReturnType<typeof getLeadEmails>>;
  emailTracking: Awaited<ReturnType<typeof getEmailTrackingForLead>>;
  cart: CartWithItems | null;
};

export async function getCloserWorkflowDetail(
  workflowId: string,
  access: AccessContext,
): Promise<CloserWorkflowDetail | null> {
  if (access.kind !== "authenticated") {
    return null;
  }

  const supabase = await createClient();
  const selectClause = `
    *,
    lead:leads!lead_id(id, company_name, lead_status, cee_sheet_id, current_workflow_id, contact_name, phone, email, worksite_address, worksite_city, worksite_postal_code, recording_notes),
    cee_sheet:cee_sheets!cee_sheet_id(id, code, label, simulator_key, workflow_key, is_commercial_active),
    assigned_agent:profiles!assigned_agent_user_id(id, full_name, email),
    assigned_confirmateur:profiles!assigned_confirmateur_user_id(id, full_name, email),
    assigned_closer:profiles!assigned_closer_user_id(id, full_name, email)
  `;

  const { data: workflow, error: workflowError } = await supabase
    .from("lead_sheet_workflows")
    .select(selectClause)
    .eq("id", workflowId)
    .maybeSingle();

  if (workflowError) {
    throw new Error(workflowError.message);
  }
  if (!workflow) {
    return null;
  }

  const workflowRow = workflow as unknown as WorkflowScopedListRow;

  const [
    { data: events, error: eventsError },
    { data: cartRef, error: cartError },
    leadDocuments,
    leadEmails,
    emailTracking,
    leadDetail,
  ] = await Promise.all([
    supabase
      .from("lead_sheet_workflow_events")
      .select("id, event_type, event_label, payload_json, created_at, created_by_profile:profiles!created_by_user_id(id, full_name, email)")
      .eq("lead_sheet_workflow_id", workflowId)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_carts")
      .select("id")
      .eq("workflow_id", workflowId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getLeadStudyDocuments(workflowRow.lead_id),
    getLeadEmails(workflowRow.lead_id),
    getEmailTrackingForLead(workflowRow.lead_id),
    getLeadById(workflowRow.lead_id, access),
  ]);

  if (eventsError) {
    throw new Error(eventsError.message);
  }
  if (cartError) {
    throw new Error(cartError.message);
  }

  return {
    workflow: workflowRow,
    leadDetail,
    events: (events ?? []) as unknown as CloserWorkflowDetail["events"],
    leadDocuments,
    leadEmails,
    emailTracking,
    cart: cartRef?.id ? ((await queryCartById(cartRef.id)) as CartWithItems | null) : null,
  };
}