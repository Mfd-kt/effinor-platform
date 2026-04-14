import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { hasFullCeeWorkflowAccess } from "@/lib/auth/cee-workflows-scope";
import type { CockpitVariant } from "@/lib/auth/cockpit-variant";
import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";
import type { CockpitFilterOptions } from "@/features/dashboard/domain/cockpit";
import type { CockpitWorkflowSnapshot } from "@/features/dashboard/domain/cockpit";
import type { CockpitAlert } from "@/features/dashboard/domain/cockpit";
import {
  buildPeriodBusinessAlerts,
  buildStructuralBusinessAlerts,
  filterCockpitAlertsForVariant,
} from "@/features/dashboard/lib/cockpit-alerts";
import type { ManagerCockpitScope, StructuralNetworkInput } from "@/features/dashboard/lib/cockpit-alert-rules";
import {
  buildWorkflowSnapshot,
  filterWorkflowsForCockpit,
  filterWorkflowsByCreatedPeriod,
  filterWorkflowsByCreatedRange,
} from "@/features/dashboard/lib/cockpit-aggregates";
import { getCockpitPeriodLabel, getCockpitPeriodRange, getCockpitPreviousPeriodRange } from "@/features/dashboard/lib/cockpit-period";
import { countLeadsCreatedInRange } from "@/features/dashboard/queries/fetch-dashboard-period-counts";
import { getLeadIdsForAccess } from "@/lib/auth/data-scope";
import type { CockpitScopeFilters } from "@/features/dashboard/domain/cockpit";
import { getAdminCeeNetworkOverview } from "@/features/cee-workflows/queries/get-admin-cee-network-overview";
import { getLeadSheetWorkflowsForAccess } from "@/features/cee-workflows/queries/get-lead-sheet-workflows";

export type CockpitBundle = {
  filters: CockpitScopeFilters;
  filterOptions: CockpitFilterOptions;
  /** Fenêtre [start, end) alignée sur `filters.period` (fin = maintenant). */
  periodRange: { startIso: string; endIso: string };
  /** Leads créés dans la période cockpit (même fenêtre que le funnel), périmètre leads RLS. */
  leadsCreatedInPeriod: number;
  /** Leads créés sur la période de comparaison (précédente). */
  leadsCreatedPrevious: number;
  /** KPI, funnel, files prioritaires — uniquement workflows créés dans la période cockpit. */
  snapshot: CockpitWorkflowSnapshot;
  /** @deprecated alias de `snapshot` */
  snapshotPeriod: CockpitWorkflowSnapshot;
  periodAlerts: CockpitAlert[];
  structuralAlerts: CockpitAlert[];
  /** Santé admin : équipes actives sans closer dans les membres. */
  teamsWithoutCloser: { teamId: string; teamName: string; sheetLabel: string }[];
  /** Fiches commerciales actives sans équipe active. */
  sheetsWithoutTeam: { sheetId: string; label: string }[];
  networkOverview: Awaited<ReturnType<typeof getAdminCeeNetworkOverview>> | null;
};

async function loadFilterOptions(
  access: AccessContext,
  workflows: WorkflowScopedListRow[],
): Promise<CockpitFilterOptions> {
  if (access.kind !== "authenticated") {
    return { sheets: [], teams: [], channels: [] };
  }
  const supabase = await createClient();

  if (hasFullCeeWorkflowAccess(access)) {
    const [sheetsRes, teamsRes] = await Promise.all([
      supabase
        .from("cee_sheets")
        .select("id, code, label")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
      supabase
        .from("cee_sheet_teams")
        .select("id, name, cee_sheet_id, is_active")
        .eq("is_active", true),
    ]);
    const sheets = (sheetsRes.data ?? []).map((s) => ({
      id: s.id,
      label: s.label?.trim() || s.code || s.id,
    }));
    const teams = (teamsRes.data ?? []).map((t) => ({
      id: t.id,
      label: t.name?.trim() || t.id,
    }));
    return { sheets, teams, channels: [] };
  }

  const sheetMap = new Map<string, string>();
  const teamIds = new Set<string>();
  for (const w of workflows) {
    if (w.cee_sheet) {
      sheetMap.set(
        w.cee_sheet.id,
        w.cee_sheet.label?.trim() || w.cee_sheet.code || w.cee_sheet.id,
      );
    }
    if (w.cee_sheet_team_id) teamIds.add(w.cee_sheet_team_id);
  }
  let teams: CockpitFilterOptions["teams"] = [...teamIds].map((id) => ({ id, label: id }));
  if (teamIds.size > 0) {
    const { data: trows } = await supabase
      .from("cee_sheet_teams")
      .select("id, name")
      .in("id", [...teamIds]);
    const tname = new Map((trows ?? []).map((t) => [t.id, t.name?.trim() || t.id] as const));
    teams = [...teamIds].map((id) => ({ id, label: tname.get(id) ?? id }));
  }
  return {
    sheets: [...sheetMap.entries()].map(([id, label]) => ({ id, label })),
    teams,
    channels: [],
  };
}

function enrichTeamNames(
  snap: CockpitWorkflowSnapshot,
  teamIdToName: Map<string, string>,
): CockpitWorkflowSnapshot {
  return {
    ...snap,
    byTeam: snap.byTeam.map((t) => ({
      ...t,
      teamName: teamIdToName.get(t.teamId) ?? t.teamName,
    })),
  };
}

function computeTeamsWithoutCloserFixed(
  teams: { id: string; name: string; ceeSheetId: string }[],
  members: { ceeSheetTeamId: string; roleInTeam: string; isActive: boolean }[],
  sheetIdToLabel: Map<string, string>,
): { teamId: string; teamName: string; sheetLabel: string }[] {
  const teamHasCloser = new Map<string, boolean>();
  for (const m of members) {
    if (!m.isActive) continue;
    if (m.roleInTeam === "closer") {
      teamHasCloser.set(m.ceeSheetTeamId, true);
    }
  }
  return teams
    .filter((t) => !teamHasCloser.get(t.id))
    .map((t) => ({
      teamId: t.id,
      teamName: t.name,
      sheetLabel: sheetIdToLabel.get(t.ceeSheetId) ?? "",
    }));
}

async function getManagerNetworkSlice(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{
  sheets: StructuralNetworkInput["sheets"];
  teams: StructuralNetworkInput["teams"];
  members: StructuralNetworkInput["members"];
} | null> {
  const { data: mgr } = await supabase
    .from("cee_sheet_team_members")
    .select("cee_sheet_team_id")
    .eq("user_id", userId)
    .eq("role_in_team", "manager")
    .eq("is_active", true);
  const teamIds = [...new Set((mgr ?? []).map((r) => r.cee_sheet_team_id))];
  if (teamIds.length === 0) return null;

  const { data: teams } = await supabase
    .from("cee_sheet_teams")
    .select("id, name, cee_sheet_id, is_active")
    .in("id", teamIds);
  const sheetIds = [...new Set((teams ?? []).map((t) => t.cee_sheet_id))];

  const { data: sheets } = await supabase
    .from("cee_sheets")
    .select(
      "id, code, label, simulator_key, workflow_key, presentation_template_key, agreement_template_key, is_commercial_active",
    )
    .in("id", sheetIds)
    .is("deleted_at", null);

  const { data: members } = await supabase
    .from("cee_sheet_team_members")
    .select("cee_sheet_team_id, role_in_team, is_active")
    .in("cee_sheet_team_id", teamIds);

  return {
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

async function getManagerCockpitScope(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ManagerCockpitScope> {
  const slice = await getManagerNetworkSlice(supabase, userId);
  if (!slice) {
    return { userId, teamIds: new Set(), sheetIds: new Set() };
  }
  return {
    userId,
    teamIds: new Set(slice.teams.map((t) => t.id)),
    sheetIds: new Set(slice.sheets.map((s) => s.id)),
  };
}

export async function getCockpitBundle(
  access: AccessContext,
  filters: CockpitScopeFilters,
  opts?: {
    includeAdminHealth?: boolean;
    cockpitVariant?: CockpitVariant;
    /** Évite un second fetch workflows quand l’appelant charge déjà la liste (ex. cockpit direction). */
    preloadedWorkflows?: WorkflowScopedListRow[];
  },
): Promise<CockpitBundle> {
  if (access.kind !== "authenticated") {
    throw new Error("Unauthorized");
  }

  const cockpitVariant = opts?.cockpitVariant ?? "default";

  const supabase = await createClient();
  const workflows =
    opts?.preloadedWorkflows ?? (await getLeadSheetWorkflowsForAccess(access, {}));
  const filterOptions = await loadFilterOptions(access, workflows);

  const leadIds = await getLeadIdsForAccess(supabase, access);
  const periodRange = getCockpitPeriodRange(filters.period);
  const prevRange = getCockpitPreviousPeriodRange(filters.period);
  const [leadsCreatedInPeriod, leadsCreatedPrevious] = await Promise.all([
    countLeadsCreatedInRange(supabase, leadIds, periodRange.startIso, periodRange.endIso),
    countLeadsCreatedInRange(supabase, leadIds, prevRange.startIso, prevRange.endIso),
  ]);

  const channels = new Set<string>();
  for (const w of workflows) {
    const c = w.lead?.lead_channel?.trim();
    if (c) channels.add(c);
  }
  filterOptions.channels = [...channels].sort();

  const scopedBase = filterWorkflowsForCockpit(workflows, filters, { applyPeriod: false });
  const scopedPeriod = filterWorkflowsByCreatedPeriod(scopedBase, filters.period);
  const scopedPrevious = filterWorkflowsByCreatedRange(scopedBase, prevRange);

  const teamIdToName = new Map(
    filterOptions.teams.map((t) => [t.id, t.label] as const),
  );
  let snapshot = buildWorkflowSnapshot(scopedPeriod);
  snapshot = enrichTeamNames(snapshot, teamIdToName);
  let snapshotPrevious = buildWorkflowSnapshot(scopedPrevious);
  snapshotPrevious = enrichTeamNames(snapshotPrevious, teamIdToName);

  const periodLabel = getCockpitPeriodLabel(filters.period);

  const periodAlertsRaw = buildPeriodBusinessAlerts({
    filters,
    periodLabel,
    snapshot,
    snapshotPrevious,
    scopedPeriodRows: scopedPeriod,
    scopedPreviousRows: scopedPrevious,
    leadsCreatedCurrent: leadsCreatedInPeriod,
    leadsCreatedPrevious,
    basePath: "",
    now: new Date(),
    userId: access.userId,
  });

  let managerScope: ManagerCockpitScope | undefined;
  if (cockpitVariant === "manager") {
    managerScope = await getManagerCockpitScope(supabase, access.userId);
  }
  const periodAlerts = filterCockpitAlertsForVariant(periodAlertsRaw, cockpitVariant, managerScope);

  let teamsWithoutCloser: CockpitBundle["teamsWithoutCloser"] = [];
  let sheetsWithoutTeam: CockpitBundle["sheetsWithoutTeam"] = [];
  let networkOverview: CockpitBundle["networkOverview"] = null;
  let structuralAlerts: CockpitAlert[] = [];

  const loadFullNetwork =
    hasFullCeeWorkflowAccess(access) &&
    (opts?.includeAdminHealth === true || cockpitVariant === "sales_director");

  if (loadFullNetwork) {
    const [{ data: allTeams }, { data: allSheets }, overview] = await Promise.all([
      supabase.from("cee_sheet_teams").select("id, name, cee_sheet_id, is_active"),
      supabase.from("cee_sheets").select("id, label, code").is("deleted_at", null),
      getAdminCeeNetworkOverview(),
    ]);

    const sheetIdToLabel = new Map(
      (allSheets ?? []).map((s) => [s.id, s.label?.trim() || s.code || s.id] as const),
    );
    const activeTeamSheetIds = new Set(
      (allTeams ?? []).filter((t) => t.is_active).map((t) => t.cee_sheet_id),
    );
    sheetsWithoutTeam = (allSheets ?? [])
      .filter((s) => !activeTeamSheetIds.has(s.id))
      .map((s) => ({ sheetId: s.id, label: sheetIdToLabel.get(s.id) ?? s.id }));

    const activeTeams = (allTeams ?? []).filter((t) => t.is_active);
    teamsWithoutCloser = computeTeamsWithoutCloserFixed(
      activeTeams.map((t) => ({
        id: t.id,
        name: t.name?.trim() || t.id,
        ceeSheetId: t.cee_sheet_id,
      })),
      (overview?.members ?? []).map((m) => ({
        ceeSheetTeamId: m.ceeSheetTeamId,
        roleInTeam: m.roleInTeam,
        isActive: m.isActive,
      })),
      sheetIdToLabel,
    );

    networkOverview = overview;

    const structuralRaw = buildStructuralBusinessAlerts({
      basePath: "",
      sheets: overview.sheets.map((s) => ({
        id: s.id,
        code: s.code,
        label: s.label,
        simulatorKey: s.simulatorKey,
        workflowKey: s.workflowKey,
        presentationTemplateKey: s.presentationTemplateKey,
        agreementTemplateKey: s.agreementTemplateKey,
        isCommercialActive: s.isCommercialActive,
      })),
      teams: overview.teams.map((t) => ({
        id: t.id,
        name: t.name,
        ceeSheetId: t.ceeSheetId,
        isActive: t.isActive,
      })),
      members: overview.members.map((m) => ({
        ceeSheetTeamId: m.ceeSheetTeamId,
        roleInTeam: m.roleInTeam,
        isActive: m.isActive,
      })),
    });
    structuralAlerts = filterCockpitAlertsForVariant(structuralRaw, cockpitVariant, managerScope);
  } else if (cockpitVariant === "manager") {
    const slice = await getManagerNetworkSlice(supabase, access.userId);
    if (slice) {
      const structuralRaw = buildStructuralBusinessAlerts({
        basePath: "",
        sheets: slice.sheets,
        teams: slice.teams,
        members: slice.members,
      });
      structuralAlerts = filterCockpitAlertsForVariant(
        structuralRaw,
        cockpitVariant,
        managerScope ?? {
          userId: access.userId,
          teamIds: new Set(slice.teams.map((t) => t.id)),
          sheetIds: new Set(slice.sheets.map((s) => s.id)),
        },
      );
    }
  }

  return {
    filters,
    filterOptions,
    periodRange,
    leadsCreatedInPeriod,
    leadsCreatedPrevious,
    snapshot,
    snapshotPeriod: snapshot,
    periodAlerts,
    structuralAlerts,
    teamsWithoutCloser,
    sheetsWithoutTeam,
    networkOverview,
  };
}
