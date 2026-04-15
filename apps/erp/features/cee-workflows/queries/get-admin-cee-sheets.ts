import { createClient } from "@/lib/supabase/server";

export type AdminCeeSheetListItem = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  sortOrder: number;
  isCommercialActive: boolean;
  simulatorKey: string | null;
  presentationTemplateKey: string | null;
  agreementTemplateKey: string | null;
  workflowKey: string | null;
  requiresTechnicalVisit: boolean;
  technicalVisitTemplateKey: string | null;
  technicalVisitTemplateVersion: number | null;
  requiresQuote: boolean;
  description: string | null;
  controlPoints: string | null;
  internalNotes: string | null;
  teamConfigured: boolean;
  memberCount: number;
  teamName: string | null;
};

export async function getAdminCeeSheets(): Promise<AdminCeeSheetListItem[]> {
  const supabase = await createClient();
  const [{ data: sheets, error: sheetsError }, { data: teams, error: teamsError }, { data: members, error: membersError }] =
    await Promise.all([
      supabase
        .from("cee_sheets")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("code", { ascending: true }),
      supabase.from("cee_sheet_teams").select("id, cee_sheet_id, name, is_active"),
      supabase.from("cee_sheet_team_members").select("id, cee_sheet_team_id, is_active"),
    ]);

  const err = sheetsError ?? teamsError ?? membersError;
  if (err) {
    throw new Error(err.message);
  }

  const activeTeamsBySheet = new Map<string, { id: string; name: string }>();
  for (const team of teams ?? []) {
    if (team.is_active) {
      activeTeamsBySheet.set(team.cee_sheet_id, { id: team.id, name: team.name });
    }
  }

  const memberCountByTeam = new Map<string, number>();
  for (const member of members ?? []) {
    if (!member.is_active) continue;
    memberCountByTeam.set(member.cee_sheet_team_id, (memberCountByTeam.get(member.cee_sheet_team_id) ?? 0) + 1);
  }

  return (sheets ?? []).map((sheet) => {
    const team = activeTeamsBySheet.get(sheet.id) ?? null;
    return {
      id: sheet.id,
      code: sheet.code,
      name: sheet.label,
      category: sheet.category ?? null,
      sortOrder: sheet.sort_order ?? 0,
      isCommercialActive: sheet.is_commercial_active ?? true,
      simulatorKey: sheet.simulator_key ?? null,
      presentationTemplateKey: sheet.presentation_template_key ?? null,
      agreementTemplateKey: sheet.agreement_template_key ?? null,
      workflowKey: sheet.workflow_key ?? null,
      requiresTechnicalVisit: sheet.requires_technical_visit ?? false,
      technicalVisitTemplateKey: sheet.technical_visit_template_key ?? null,
      technicalVisitTemplateVersion: sheet.technical_visit_template_version ?? null,
      requiresQuote: sheet.requires_quote ?? true,
      description: sheet.description ?? null,
      controlPoints: sheet.control_points ?? null,
      internalNotes: sheet.internal_notes ?? null,
      teamConfigured: Boolean(team),
      memberCount: team ? memberCountByTeam.get(team.id) ?? 0 : 0,
      teamName: team?.name ?? null,
    };
  });
}
