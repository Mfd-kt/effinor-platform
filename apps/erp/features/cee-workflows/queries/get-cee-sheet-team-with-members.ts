import { createClient } from "@/lib/supabase/server";

export type AdminCeeSheetTeamMember = {
  id: string;
  userId: string;
  roleInTeam: string;
  isActive: boolean;
  fullName: string | null;
  email: string;
};

export type AdminCeeSheetTeamDetail = {
  id: string;
  sheetId: string;
  name: string;
  isActive: boolean;
  members: AdminCeeSheetTeamMember[];
};

export async function getCeeSheetTeamWithMembers(
  sheetId: string,
): Promise<AdminCeeSheetTeamDetail | null> {
  const supabase = await createClient();
  const { data: team, error: teamError } = await supabase
    .from("cee_sheet_teams")
    .select("*")
    .eq("cee_sheet_id", sheetId)
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

  const { data: members, error: membersError } = await supabase
    .from("cee_sheet_team_members")
    .select("id, user_id, role_in_team, is_active, profile:profiles!user_id(full_name, email)")
    .eq("cee_sheet_team_id", team.id)
    .order("created_at", { ascending: true });

  if (membersError) {
    throw new Error(membersError.message);
  }

  return {
    id: team.id,
    sheetId: team.cee_sheet_id,
    name: team.name,
    isActive: team.is_active,
    members: ((members ?? []) as unknown as Array<{
      id: string;
      user_id: string;
      role_in_team: string;
      is_active: boolean;
      profile: { full_name: string | null; email: string } | null;
    }>).map((member) => ({
      id: member.id,
      userId: member.user_id,
      roleInTeam: member.role_in_team,
      isActive: member.is_active,
      fullName: member.profile?.full_name ?? null,
      email: member.profile?.email ?? "",
    })),
  };
}
