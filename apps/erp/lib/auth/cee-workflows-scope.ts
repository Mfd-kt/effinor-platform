import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccessContext } from "@/lib/auth/access-context";
import {
  PERM_ACCESS_CEE_WORKFLOWS,
  PERM_CEE_WORKFLOWS_SCOPE_ALL,
  PERM_CEE_WORKFLOWS_SCOPE_TEAM,
} from "@/lib/auth/permission-codes";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

export function hasFullCeeWorkflowAccess(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (
    access.roleCodes.includes("super_admin") ||
    access.roleCodes.includes("admin") ||
    access.roleCodes.includes("sales_director")
  ) {
    return true;
  }
  return access.permissionCodes.includes(PERM_CEE_WORKFLOWS_SCOPE_ALL);
}

export function canAccessCeeWorkflowsModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (hasFullCeeWorkflowAccess(access)) {
    return true;
  }
  if (access.permissionCodes.length === 0) {
    return (
      access.roleCodes.includes("sales_agent") ||
      access.roleCodes.includes("confirmer") ||
      access.roleCodes.includes("closer")
    );
  }
  return (
    access.permissionCodes.includes(PERM_ACCESS_CEE_WORKFLOWS) &&
    access.permissionCodes.includes(PERM_CEE_WORKFLOWS_SCOPE_TEAM)
  );
}

export async function resolveAllowedCeeSheetIdsForAccess(
  supabase: Supabase,
  access: AccessContext,
): Promise<string[] | "all"> {
  if (access.kind !== "authenticated") {
    return [];
  }
  if (hasFullCeeWorkflowAccess(access)) {
    return "all";
  }
  if (!canAccessCeeWorkflowsModule(access)) {
    return [];
  }

  const { data, error } = await supabase
    .from("cee_sheet_team_members")
    .select("cee_sheet_teams!inner(cee_sheet_id)")
    .eq("user_id", access.userId)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  const sheetIds = new Set<string>();
  for (const row of data ?? []) {
    const team = row.cee_sheet_teams as { cee_sheet_id?: string } | null;
    if (team?.cee_sheet_id) {
      sheetIds.add(team.cee_sheet_id);
    }
  }
  return [...sheetIds];
}
