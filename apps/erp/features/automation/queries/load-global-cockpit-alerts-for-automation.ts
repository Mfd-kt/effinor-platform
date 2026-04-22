import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

import { DEFAULT_COCKPIT_FILTERS } from "@/features/dashboard/domain/cockpit";
import type { CockpitAlert } from "@/features/dashboard/domain/cockpit";
import {
  buildPeriodBusinessAlerts,
  buildStructuralBusinessAlerts,
  sortCockpitAlerts,
  type StructuralNetworkInput,
} from "@/features/dashboard/lib/cockpit-alerts";
import {
  buildWorkflowSnapshot,
  filterWorkflowsByCreatedPeriod,
  filterWorkflowsByCreatedRange,
  filterWorkflowsForCockpit,
} from "@/features/dashboard/lib/cockpit-aggregates";
import { getCockpitPeriodLabel, getCockpitPeriodRange, getCockpitPreviousPeriodRange } from "@/features/dashboard/lib/cockpit-period";
import { countLeadsCreatedInRange } from "@/features/dashboard/queries/fetch-dashboard-period-counts";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

const WORKFLOW_SELECT = `
  *,
  lead:leads!lead_id(id, created_at, company_name, lead_status, cee_sheet_id, current_workflow_id, contact_name, phone, email, worksite_address, worksite_city, worksite_postal_code, heating_type, recording_notes, lead_channel, lead_origin, callback_at),
  cee_sheet:cee_sheets!cee_sheet_id(id, code, label, simulator_key, workflow_key, is_commercial_active),
  assigned_agent:profiles!assigned_agent_user_id(id, full_name, email),
  assigned_confirmateur:profiles!assigned_confirmateur_user_id(id, full_name, email),
  assigned_closer:profiles!assigned_closer_user_id(id, full_name, email)
`;

/**
 * Charge les alertes cockpit (période + structurel) avec vue **globale** — réservé au cron / service role.
 */
export async function loadGlobalCockpitAlertsForAutomation(): Promise<CockpitAlert[]> {
  const supabase = createAdminClient();
  const filters = DEFAULT_COCKPIT_FILTERS;
  const periodRange = getCockpitPeriodRange(filters.period);
  const prevRange = getCockpitPreviousPeriodRange(filters.period);

  const { data: workflowRows, error: wfError } = await supabase
    .from("lead_sheet_workflows")
    .select(WORKFLOW_SELECT)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(8000);

  if (wfError) {
    throw new Error(wfError.message);
  }

  const workflows = workflowRows ?? [];

  const [leadsCreatedCurrent, leadsCreatedPrevious] = await Promise.all([
    countLeadsCreatedInRange(supabase, "all", periodRange.startIso, periodRange.endIso),
    countLeadsCreatedInRange(supabase, "all", prevRange.startIso, prevRange.endIso),
  ]);

  const scopedBase = filterWorkflowsForCockpit(workflows, filters, { applyPeriod: false });
  const scopedPeriod = filterWorkflowsByCreatedPeriod(scopedBase, filters.period);
  const scopedPrevious = filterWorkflowsByCreatedRange(scopedBase, prevRange);

  const snapshot = buildWorkflowSnapshot(scopedPeriod);
  const snapshotPrevious = buildWorkflowSnapshot(scopedPrevious);
  const periodLabel = getCockpitPeriodLabel(filters.period);

  const periodAlertsRaw = buildPeriodBusinessAlerts({
    filters,
    periodLabel,
    snapshot,
    snapshotPrevious,
    scopedPeriodRows: scopedPeriod,
    scopedPreviousRows: scopedPrevious,
    leadsCreatedCurrent,
    leadsCreatedPrevious,
    basePath: "",
    now: new Date(),
    userId: "00000000-0000-0000-0000-000000000000",
  });

  const structuralInput = await loadStructuralNetworkInput(supabase);
  const structuralRaw = buildStructuralBusinessAlerts(structuralInput);

  const merged = [...periodAlertsRaw, ...structuralRaw];
  /** Cron automation : toutes les alertes métiers (pas de filtre rôle cockpit). */
  return sortCockpitAlerts(merged);
}

async function loadStructuralNetworkInput(supabase: Supabase): Promise<StructuralNetworkInput> {
  const [{ data: sheets }, { data: teams }, { data: members }] = await Promise.all([
    supabase
      .from("cee_sheets")
      .select(
        "id, code, label, simulator_key, workflow_key, presentation_template_key, agreement_template_key, is_commercial_active",
      )
      .is("deleted_at", null),
    supabase.from("cee_sheet_teams").select("id, name, cee_sheet_id, is_active"),
    supabase.from("cee_sheet_team_members").select("cee_sheet_team_id, role_in_team, is_active"),
  ]);

  return {
    basePath: "",
    sheets: (sheets ?? []).map((s) => ({
      id: s.id,
      code: s.code,
      label: s.label,
      simulatorKey: s.simulator_key ?? null,
      workflowKey: s.workflow_key ?? null,
      presentationTemplateKey: s.presentation_template_key ?? null,
      agreementTemplateKey: s.agreement_template_key ?? null,
      isCommercialActive: s.is_commercial_active ?? true,
    })),
    teams: (teams ?? []).map((t) => ({
      id: t.id,
      name: t.name?.trim() || t.id,
      ceeSheetId: t.cee_sheet_id,
      isActive: t.is_active,
    })),
    members: (members ?? []).map((m) => ({
      ceeSheetTeamId: m.cee_sheet_team_id,
      roleInTeam: m.role_in_team,
      isActive: m.is_active,
    })),
  };
}
