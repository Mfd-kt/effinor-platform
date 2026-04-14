import { createClient } from "@/lib/supabase/server";

export type ManagedTeamMemberRow = {
  userId: string;
  fullName: string | null;
  email: string;
  roleInTeam: string;
  teamId: string;
  teamName: string;
  sheetId: string;
  sheetLabel: string;
  isActive: boolean;
};

export type ManagedTeamsContext = {
  teamIds: string[];
  sheetIds: string[];
  teams: { id: string; name: string; sheetId: string; sheetLabel: string }[];
  members: ManagedTeamMemberRow[];
};

/**
 * Périmètre équipes où l’utilisateur est **manager** actif (pas les autres rôles).
 */
export async function getManagedTeamsContext(userId: string): Promise<ManagedTeamsContext | null> {
  const supabase = await createClient();
  const { data: mgrRows, error: mgrErr } = await supabase
    .from("cee_sheet_team_members")
    .select("cee_sheet_team_id")
    .eq("user_id", userId)
    .eq("role_in_team", "manager")
    .eq("is_active", true);
  if (mgrErr) throw new Error(mgrErr.message);
  const teamIds = [...new Set((mgrRows ?? []).map((r) => r.cee_sheet_team_id))];
  if (teamIds.length === 0) return null;

  const { data: teams, error: teamsErr } = await supabase
    .from("cee_sheet_teams")
    .select("id, name, cee_sheet_id")
    .in("id", teamIds);
  if (teamsErr) throw new Error(teamsErr.message);

  const sheetIds = [...new Set((teams ?? []).map((t) => t.cee_sheet_id))];
  const { data: sheets, error: sheetsErr } = await supabase
    .from("cee_sheets")
    .select("id, code, label")
    .in("id", sheetIds)
    .is("deleted_at", null);
  if (sheetsErr) throw new Error(sheetsErr.message);
  const sheetLabel = new Map(
    (sheets ?? []).map((s) => [s.id, s.label?.trim() || s.code || s.id] as const),
  );

  const { data: memberRows, error: memErr } = await supabase
    .from("cee_sheet_team_members")
    .select(
      "user_id, role_in_team, is_active, cee_sheet_team_id, profile:profiles!user_id(full_name, email)",
    )
    .in("cee_sheet_team_id", teamIds);
  if (memErr) throw new Error(memErr.message);

  const teamName = new Map((teams ?? []).map((t) => [t.id, t.name?.trim() || t.id] as const));
  const teamSheet = new Map((teams ?? []).map((t) => [t.id, t.cee_sheet_id] as const));

  const members: ManagedTeamMemberRow[] = (
    (memberRows ?? []) as unknown as Array<{
      user_id: string;
      role_in_team: string;
      is_active: boolean;
      cee_sheet_team_id: string;
      profile: { full_name: string | null; email: string } | null;
    }>
  ).map((m) => {
    const tid = m.cee_sheet_team_id;
    const sid = teamSheet.get(tid) ?? "";
    return {
      userId: m.user_id,
      fullName: m.profile?.full_name ?? null,
      email: m.profile?.email ?? "",
      roleInTeam: m.role_in_team,
      teamId: tid,
      teamName: teamName.get(tid) ?? tid,
      sheetId: sid,
      sheetLabel: sheetLabel.get(sid) ?? sid,
      isActive: m.is_active,
    };
  });

  return {
    teamIds,
    sheetIds,
    teams: (teams ?? []).map((t) => ({
      id: t.id,
      name: t.name?.trim() || t.id,
      sheetId: t.cee_sheet_id,
      sheetLabel: sheetLabel.get(t.cee_sheet_id) ?? t.cee_sheet_id,
    })),
    members,
  };
}

export async function isCeeTeamManager(userId: string): Promise<boolean> {
  const ctx = await getManagedTeamsContext(userId);
  return ctx != null;
}
