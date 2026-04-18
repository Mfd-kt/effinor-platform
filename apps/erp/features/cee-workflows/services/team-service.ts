import type { SupabaseClient } from "@supabase/supabase-js";

import { prefillWorkflowAssignmentsFromMembers } from "@/features/cee-workflows/domain/assignments";
import type { CeeTeamRole } from "@/features/cee-workflows/domain/constants";
import type {
  CeeSheetTeamMemberWithProfile,
  CeeSheetTeamWithMembers,
  WorkflowRoleBucket,
} from "@/features/cee-workflows/types";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

export async function getSheetTeamForSheet(
  supabase: Supabase,
  ceeSheetId: string,
): Promise<CeeSheetTeamWithMembers | null> {
  const { data: team, error: teamError } = await supabase
    .from("cee_sheet_teams")
    .select("*")
    .eq("cee_sheet_id", ceeSheetId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (teamError) {
    throw new Error(teamError.message);
  }

  if (!team) {
    return null;
  }

  const [{ data: sheet, error: sheetError }, { data: members, error: membersError }] = await Promise.all([
    supabase
      .from("cee_sheets")
      .select("id, code, label, workflow_key, simulator_key")
      .eq("id", ceeSheetId)
      .maybeSingle(),
    supabase
      .from("cee_sheet_team_members")
      .select("*, profile:profiles!user_id(id, full_name, email)")
      .eq("cee_sheet_team_id", team.id)
      .order("created_at", { ascending: true }),
  ]);

  if (sheetError) {
    throw new Error(sheetError.message);
  }
  if (membersError) {
    throw new Error(membersError.message);
  }

  return {
    ...team,
    cee_sheet: sheet ?? null,
    members: (members ?? []) as unknown as CeeSheetTeamMemberWithProfile[],
  };
}

export async function getSheetMembersByRole(
  supabase: Supabase,
  ceeSheetId: string,
  role: CeeTeamRole,
): Promise<CeeSheetTeamMemberWithProfile[]> {
  const team = await getSheetTeamForSheet(supabase, ceeSheetId);
  if (!team) {
    return [];
  }
  return team.members.filter(
    (member: CeeSheetTeamMemberWithProfile) => member.role_in_team === role && member.is_active,
  );
}

export async function getWorkflowRoleBucket(
  supabase: Supabase,
  ceeSheetId: string,
): Promise<WorkflowRoleBucket> {
  const team = await getSheetTeamForSheet(supabase, ceeSheetId);
  const members = team?.members ?? [];

  return {
    agent: members.filter(
      (member: CeeSheetTeamMemberWithProfile) => member.role_in_team === "agent" && member.is_active,
    ),
    confirmateur: members.filter(
      (member: CeeSheetTeamMemberWithProfile) => member.role_in_team === "confirmateur" && member.is_active,
    ),
    closer: members.filter(
      (member: CeeSheetTeamMemberWithProfile) => member.role_in_team === "closer" && member.is_active,
    ),
    manager: members.filter(
      (member: CeeSheetTeamMemberWithProfile) => member.role_in_team === "manager" && member.is_active,
    ),
  };
}

export async function prefillWorkflowAssignments(
  supabase: Supabase,
  ceeSheetId: string,
): Promise<{
  ceeSheetTeamId: string | null;
  assignedAgentUserId: string | null;
  assignedConfirmateurUserId: string | null;
  assignedCloserUserId: string | null;
}> {
  const team = await getSheetTeamForSheet(supabase, ceeSheetId);
  if (!team) {
    return {
      ceeSheetTeamId: null,
      assignedAgentUserId: null,
      assignedConfirmateurUserId: null,
      assignedCloserUserId: null,
    };
  }

  const assignments = prefillWorkflowAssignmentsFromMembers(
    team.members.map((member: CeeSheetTeamMemberWithProfile) => ({
      userId: member.user_id,
      roleInTeam: member.role_in_team as CeeTeamRole,
      isActive: member.is_active,
    })),
  );

  return {
    ceeSheetTeamId: team.id,
    ...assignments,
  };
}
