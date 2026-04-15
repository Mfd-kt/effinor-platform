import { createClient } from "@/lib/supabase/server";
import type { AdminCeeSheetListItem } from "@/features/cee-workflows/queries/get-admin-cee-sheets";

export async function getAdminCeeSheetDetail(
  sheetId: string,
): Promise<AdminCeeSheetListItem | null> {
  const supabase = await createClient();
  const { data: sheet, error: sheetError } = await supabase.from("cee_sheets").select("*").eq("id", sheetId).maybeSingle();
  if (sheetError) throw new Error(sheetError.message);
  if (!sheet) {
    return null;
  }

  const { data: team, error: teamError } = await supabase
    .from("cee_sheet_teams")
    .select("id, name, is_active")
    .eq("cee_sheet_id", sheetId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (teamError) throw new Error(teamError.message);

  let memberCount = 0;
  if (team?.id) {
    const { data: members, error: membersError } = await supabase
      .from("cee_sheet_team_members")
      .select("id")
      .eq("is_active", true)
      .eq("cee_sheet_team_id", team.id);
    if (membersError) throw new Error(membersError.message);
    memberCount = (members ?? []).length;
  }

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
    memberCount,
    teamName: team?.name ?? null,
  };
}
