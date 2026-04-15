import { createClient } from "@/lib/supabase/server";
import type { AccessContext } from "@/lib/auth/access-context";
import { hasFullCeeWorkflowAccess, resolveAllowedCeeSheetIdsForAccess } from "@/lib/auth/cee-workflows-scope";
import { CEE_SHEET_WORKFLOW_EMBED } from "@/features/cee-workflows/queries/cee-sheet-workflow-embed";
import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";

export type WorkflowListParams = {
  leadId?: string;
  ceeSheetId?: string;
  workflowStatus?: string;
  includeArchived?: boolean;
  /**
   * Inclut les workflows / leads « perdus » (statut workflow `lost` ou lead `lost`).
   * Par défaut : exclus des listes opérationnelles ; à activer pour le cockpit (funnel) et les accès par ID.
   */
  includeLostWorkflows?: boolean;
  /** Limite aux workflows dont le lead a été créé par cet agent (`leads.created_by_agent_id`). */
  leadCreatedByAgentUserId?: string;
};

function applyCommonFilters<T extends { eq: Function; is: Function }>(query: T, params: WorkflowListParams): T {
  let next = query;
  if (!params.includeArchived) {
    next = next.eq("is_archived", false);
  }
  if (params.leadId) {
    next = next.eq("lead_id", params.leadId);
  }
  if (params.ceeSheetId) {
    next = next.eq("cee_sheet_id", params.ceeSheetId);
  }
  if (params.workflowStatus) {
    next = next.eq("workflow_status", params.workflowStatus);
  }
  return next;
}

function mergeUniqueRows(rows: WorkflowScopedListRow[][]): WorkflowScopedListRow[] {
  const map = new Map<string, WorkflowScopedListRow>();
  for (const group of rows) {
    for (const row of group) {
      map.set(row.id, row);
    }
  }
  return [...map.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Les workflows restent en base si le lead est soft-deleted : on les masque (poste agent, cockpit, etc.). */
function dropWorkflowsForDeletedLeads(rows: WorkflowScopedListRow[]): WorkflowScopedListRow[] {
  return rows.filter((row) => {
    const lead = row.lead;
    if (!lead) return false;
    return lead.deleted_at == null;
  });
}

/** Masque les dossiers perdus des vues opérationnelles (files agent / closer / etc.), pas du cockpit. */
function hideOperationalLostWorkflows(
  rows: WorkflowScopedListRow[],
  params: WorkflowListParams,
): WorkflowScopedListRow[] {
  if (
    params.includeLostWorkflows === true ||
    params.leadId ||
    params.workflowStatus === "lost"
  ) {
    return rows;
  }
  return rows.filter((row) => {
    if (row.workflow_status === "lost") return false;
    if (row.lead?.lead_status === "lost") return false;
    return true;
  });
}

function finalizeWorkflowRows(
  rows: WorkflowScopedListRow[],
  params: WorkflowListParams,
): WorkflowScopedListRow[] {
  return hideOperationalLostWorkflows(dropWorkflowsForDeletedLeads(rows), params);
}

async function resolveLeadIdsCreatedByAgent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  creatorUserId: string,
  explicitLeadId?: string,
): Promise<string[]> {
  if (explicitLeadId) {
    const { data, error } = await supabase
      .from("leads")
      .select("id")
      .eq("id", explicitLeadId)
      .eq("created_by_agent_id", creatorUserId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data?.id ? [data.id] : [];
  }

  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("created_by_agent_id", creatorUserId)
    .is("deleted_at", null);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => r.id);
}

export async function getLeadSheetWorkflowsForLead(
  leadId: string,
  access: AccessContext,
): Promise<WorkflowScopedListRow[]> {
  return getLeadSheetWorkflowsForAccess(access, { leadId });
}

export async function getLeadSheetWorkflowsForAccess(
  access: AccessContext,
  params: WorkflowListParams = {},
): Promise<WorkflowScopedListRow[]> {
  if (access.kind !== "authenticated") {
    return [];
  }

  const supabase = await createClient();

  let creatorLeadIds: string[] | null = null;
  if (params.leadCreatedByAgentUserId) {
    creatorLeadIds = await resolveLeadIdsCreatedByAgent(
      supabase,
      params.leadCreatedByAgentUserId,
      params.leadId,
    );
    if (creatorLeadIds.length === 0) {
      return [];
    }
  }

  const selectClause = `
    *,
    lead:leads!lead_id(id, created_at, company_name, lead_status, cee_sheet_id, current_workflow_id, civility, first_name, last_name, contact_name, phone, email, worksite_address, worksite_city, worksite_postal_code, heating_type, recording_notes, lead_channel, lead_origin, callback_at, deleted_at),
    cee_sheet:cee_sheets!cee_sheet_id(${CEE_SHEET_WORKFLOW_EMBED}),
    assigned_agent:profiles!assigned_agent_user_id(id, full_name, email),
    assigned_confirmateur:profiles!assigned_confirmateur_user_id(id, full_name, email),
    assigned_closer:profiles!assigned_closer_user_id(id, full_name, email),
    cee_sheet_team:cee_sheet_teams!cee_sheet_team_id(
      id,
      name,
      cee_sheet_team_members(
        role_in_team,
        is_active,
        user_id,
        profile:profiles!user_id(id, full_name, email)
      )
    )
  `;

  if (hasFullCeeWorkflowAccess(access)) {
    let query = applyCommonFilters(
      supabase.from("lead_sheet_workflows").select(selectClause).order("created_at", { ascending: false }),
      params,
    );
    if (creatorLeadIds) {
      query = query.in("lead_id", creatorLeadIds);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    return finalizeWorkflowRows((data ?? []) as unknown as WorkflowScopedListRow[], params);
  }

  const allowedSheetIds = await resolveAllowedCeeSheetIdsForAccess(supabase, access);
  const scopedRows: WorkflowScopedListRow[][] = [];

  if (allowedSheetIds !== "all" && allowedSheetIds.length > 0) {
    let query = applyCommonFilters(
      supabase
        .from("lead_sheet_workflows")
        .select(selectClause)
        .in("cee_sheet_id", allowedSheetIds)
        .order("created_at", { ascending: false }),
      params,
    );
    if (creatorLeadIds) {
      query = query.in("lead_id", creatorLeadIds);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    scopedRows.push(
      finalizeWorkflowRows((data ?? []) as unknown as WorkflowScopedListRow[], params),
    );
  }

  let assignedQuery = applyCommonFilters(
    supabase
      .from("lead_sheet_workflows")
      .select(selectClause)
      .or(
        `assigned_agent_user_id.eq.${access.userId},assigned_confirmateur_user_id.eq.${access.userId},assigned_closer_user_id.eq.${access.userId}`,
      )
      .order("created_at", { ascending: false }),
    params,
  );
  if (creatorLeadIds) {
    assignedQuery = assignedQuery.in("lead_id", creatorLeadIds);
  }
  const { data: assignedData, error: assignedError } = await assignedQuery;
  if (assignedError) {
    throw new Error(assignedError.message);
  }
  scopedRows.push(
    finalizeWorkflowRows((assignedData ?? []) as unknown as WorkflowScopedListRow[], params),
  );

  return mergeUniqueRows(scopedRows);
}
