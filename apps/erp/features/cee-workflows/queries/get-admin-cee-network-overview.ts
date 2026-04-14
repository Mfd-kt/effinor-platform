import { createClient } from "@/lib/supabase/server";
import type {
  AdminCeeNetworkMember,
  AdminCeeNetworkSheet,
  AdminCeeNetworkTeam,
  AdminCeeNetworkWorkflow,
} from "@/features/cee-workflows/lib/admin-cee-network";

export type AdminCeeNetworkOverviewData = {
  sheets: AdminCeeNetworkSheet[];
  teams: AdminCeeNetworkTeam[];
  members: AdminCeeNetworkMember[];
  workflows: AdminCeeNetworkWorkflow[];
};

export async function getAdminCeeNetworkOverview(): Promise<AdminCeeNetworkOverviewData> {
  const supabase = await createClient();
  const [
    { data: sheets, error: sheetsError },
    { data: teams, error: teamsError },
    { data: members, error: membersError },
    { data: workflows, error: workflowsError },
  ] = await Promise.all([
    supabase
      .from("cee_sheets")
      .select(
        "id, code, label, simulator_key, workflow_key, presentation_template_key, agreement_template_key, is_commercial_active",
      )
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("code", { ascending: true }),
    supabase
      .from("cee_sheet_teams")
      .select("id, cee_sheet_id, name, is_active"),
    supabase
      .from("cee_sheet_team_members")
      .select("id, cee_sheet_team_id, user_id, role_in_team, is_active, profile:profiles!user_id(full_name, email)"),
    supabase
      .from("lead_sheet_workflows")
      .select("id, cee_sheet_id, cee_sheet_team_id, workflow_status, assigned_agent_user_id, assigned_confirmateur_user_id, assigned_closer_user_id, is_archived"),
  ]);

  const err = sheetsError ?? teamsError ?? membersError ?? workflowsError;
  if (err) {
    throw new Error(err.message);
  }

  return {
    sheets: (sheets ?? []).map((sheet) => ({
      id: sheet.id,
      code: sheet.code,
      label: sheet.label,
      simulatorKey: sheet.simulator_key ?? null,
      workflowKey: sheet.workflow_key ?? null,
      presentationTemplateKey: sheet.presentation_template_key ?? null,
      agreementTemplateKey: sheet.agreement_template_key ?? null,
      isCommercialActive: sheet.is_commercial_active ?? true,
    })),
    teams: (teams ?? []).map((team) => ({
      id: team.id,
      ceeSheetId: team.cee_sheet_id,
      name: team.name,
      isActive: team.is_active,
    })),
    members: ((members ?? []) as unknown as Array<{
      id: string;
      cee_sheet_team_id: string;
      user_id: string;
      role_in_team: string;
      is_active: boolean;
      profile: { full_name: string | null; email: string } | null;
    }>).map((member) => ({
      id: member.id,
      ceeSheetTeamId: member.cee_sheet_team_id,
      userId: member.user_id,
      roleInTeam: member.role_in_team,
      isActive: member.is_active,
      fullName: member.profile?.full_name ?? null,
      email: member.profile?.email ?? "",
    })),
    workflows: (workflows ?? []).map((workflow) => ({
      id: workflow.id,
      ceeSheetId: workflow.cee_sheet_id,
      ceeSheetTeamId: workflow.cee_sheet_team_id ?? null,
      workflowStatus: workflow.workflow_status,
      assignedAgentUserId: workflow.assigned_agent_user_id ?? null,
      assignedConfirmateurUserId: workflow.assigned_confirmateur_user_id ?? null,
      assignedCloserUserId: workflow.assigned_closer_user_id ?? null,
      isArchived: workflow.is_archived,
    })),
  };
}
