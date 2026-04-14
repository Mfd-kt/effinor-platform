import { createClient } from "@/lib/supabase/server";
import type { AccessContext } from "@/lib/auth/access-context";
import {
  classifyAgentActivity,
  classifyAgentActivityInRange,
  mapWorkflowToAgentActivityItem,
  type AgentActivityBuckets,
  type AgentAvailableSheet,
} from "@/features/cee-workflows/lib/agent-workflow-activity";
import { contactDisplayName } from "@/features/leads/lib/contact-map";
import type { CockpitIsoRange } from "@/features/dashboard/lib/cockpit-period";
import { getAgentAvailableSheets } from "@/features/cee-workflows/queries/get-agent-available-sheets";
import {
  getLeadSheetWorkflowsForAccess,
  type WorkflowListParams,
} from "@/features/cee-workflows/queries/get-lead-sheet-workflows";

export type AgentDashboardData = {
  sheets: AgentAvailableSheet[];
  activity: AgentActivityBuckets;
};

export type AgentDashboardLoadOptions = {
  /** Poste /agent : ne charger que les workflows des leads créés par l’utilisateur (`created_by_agent_id`). */
  restrictToLeadsCreatedByCurrentUser?: boolean;
};

function workflowParamsForAgentDashboard(
  access: AccessContext,
  options: AgentDashboardLoadOptions | undefined,
  extra: WorkflowListParams = {},
): WorkflowListParams {
  if (access.kind !== "authenticated" || !options?.restrictToLeadsCreatedByCurrentUser) {
    return extra;
  }
  return { ...extra, leadCreatedByAgentUserId: access.userId };
}

export async function getAgentDraftWorkflows(access: AccessContext) {
  const workflows = await getLeadSheetWorkflowsForAccess(access, { workflowStatus: "draft" });
  return workflows.map((workflow) =>
    mapWorkflowToAgentActivityItem(workflow, {
      civility: workflow.lead?.civility ?? null,
      contactName: workflow.lead
        ? (contactDisplayName(workflow.lead) ?? workflow.lead.contact_name?.trim() ?? null)
        : null,
      phone: workflow.lead?.phone ?? null,
      email: workflow.lead?.email ?? null,
      address: workflow.lead?.worksite_address ?? null,
      city: workflow.lead?.worksite_city ?? null,
      postalCode: workflow.lead?.worksite_postal_code ?? null,
      notes: workflow.lead?.recording_notes ?? null,
    }),
  );
}

export async function getAgentRecentValidatedWorkflows(access: AccessContext) {
  const workflows = await getLeadSheetWorkflowsForAccess(access, {});
  const today = new Date().toISOString().slice(0, 10);
  return workflows
    .filter(
      (workflow) =>
        workflow.updated_at.startsWith(today) &&
        (workflow.workflow_status === "simulation_done" || workflow.workflow_status === "qualified"),
    )
    .map((workflow) =>
      mapWorkflowToAgentActivityItem(workflow, {
        civility: workflow.lead?.civility ?? null,
        contactName: workflow.lead
          ? (contactDisplayName(workflow.lead) ?? workflow.lead.contact_name?.trim() ?? null)
          : null,
        phone: workflow.lead?.phone ?? null,
        email: workflow.lead?.email ?? null,
        address: workflow.lead?.worksite_address ?? null,
        city: workflow.lead?.worksite_city ?? null,
        postalCode: workflow.lead?.worksite_postal_code ?? null,
        notes: workflow.lead?.recording_notes ?? null,
      }),
    );
}

export async function getAgentDashboardData(
  access: AccessContext,
  workflowCreatedRange?: CockpitIsoRange,
  options?: AgentDashboardLoadOptions,
): Promise<AgentDashboardData> {
  if (access.kind !== "authenticated") {
    return {
      sheets: [],
      activity: { drafts: [], validatedToday: [], sentToConfirmateur: [], recent: [] },
    };
  }

  const sheets = await getAgentAvailableSheets(access);
  let workflows = await getLeadSheetWorkflowsForAccess(
    access,
    workflowParamsForAgentDashboard(access, options, {}),
  );
  if (workflowCreatedRange) {
    workflows = workflows.filter(
      (w) =>
        w.created_at >= workflowCreatedRange.startIso && w.created_at < workflowCreatedRange.endIso,
    );
  }
  const items = workflows.map((workflow) =>
    mapWorkflowToAgentActivityItem(workflow, {
      civility: workflow.lead?.civility ?? null,
      contactName: workflow.lead
        ? (contactDisplayName(workflow.lead) ?? workflow.lead.contact_name?.trim() ?? null)
        : null,
      phone: workflow.lead?.phone ?? null,
      email: workflow.lead?.email ?? null,
      address: workflow.lead?.worksite_address ?? null,
      city: workflow.lead?.worksite_city ?? null,
      postalCode: workflow.lead?.worksite_postal_code ?? null,
      notes: workflow.lead?.recording_notes ?? null,
    }),
  );

  const activity: AgentActivityBuckets = workflowCreatedRange
    ? classifyAgentActivityInRange(items, workflowCreatedRange)
    : classifyAgentActivity(items, new Date().toISOString().slice(0, 10));

  return {
    sheets,
    activity,
  };
}

export async function getAgentSheetDefault(access: AccessContext): Promise<AgentAvailableSheet | null> {
  const sheets = await getAgentAvailableSheets(access);
  return sheets[0] ?? null;
}

export async function getAgentDashboardServerContext(access: AccessContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    userId: user?.id ?? null,
    dashboard: await getAgentDashboardData(access, undefined, { restrictToLeadsCreatedByCurrentUser: true }),
  };
}
