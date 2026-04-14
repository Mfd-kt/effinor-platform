import { createClient } from "@/lib/supabase/server";
import type { AccessContext } from "@/lib/auth/access-context";
import type { AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";

export async function getAgentAvailableSheets(
  access: AccessContext,
): Promise<AgentAvailableSheet[]> {
  if (access.kind !== "authenticated") {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cee_sheet_team_members")
    .select(
      `
      role_in_team,
      team:cee_sheet_teams!cee_sheet_team_id(
        id,
        name,
        is_active,
        cee_sheet:cee_sheets!cee_sheet_id(
          id,
          code,
          label,
          description,
          calculation_profile,
          simulator_key,
          presentation_template_key,
          agreement_template_key,
          requires_technical_visit,
          requires_quote,
          workflow_key,
          is_commercial_active,
          control_points
        )
      )
    `,
    )
    .eq("user_id", access.userId)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, AgentAvailableSheet>();
  for (const row of (data ?? []) as unknown as Array<{
    role_in_team: string;
    team: {
      id: string;
      name: string;
      is_active: boolean;
      cee_sheet: {
        id: string;
        code: string;
        label: string;
        description: string | null;
        calculation_profile: string | null;
        simulator_key: string | null;
        presentation_template_key: string | null;
        agreement_template_key: string | null;
        requires_technical_visit: boolean;
        requires_quote: boolean;
        workflow_key: string | null;
        is_commercial_active: boolean;
        control_points: string | null;
      } | null;
    } | null;
  }>) {
    if (!row.team?.is_active || !row.team.cee_sheet) continue;
    const sheet = row.team.cee_sheet;
    const existing = map.get(sheet.id);
    if (existing) {
      if (!existing.roles.includes(row.role_in_team)) {
        existing.roles.push(row.role_in_team);
      }
      continue;
    }

    map.set(sheet.id, {
      id: sheet.id,
      code: sheet.code,
      label: sheet.label,
      simulatorKey: sheet.simulator_key,
      calculationProfile: sheet.calculation_profile ?? null,
      workflowKey: sheet.workflow_key,
      presentationTemplateKey: sheet.presentation_template_key,
      agreementTemplateKey: sheet.agreement_template_key,
      requiresTechnicalVisit: sheet.requires_technical_visit,
      requiresQuote: sheet.requires_quote,
      isCommercialActive: sheet.is_commercial_active,
      description: sheet.description,
      controlPoints: sheet.control_points,
      teamName: row.team.name,
      roles: [row.role_in_team],
    });
  }

  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}
