import { createClient } from "@/lib/supabase/server";
import type { AccessContext } from "@/lib/auth/access-context";
import { hasFullCeeWorkflowAccess } from "@/lib/auth/cee-workflows-scope";

import type { LeadGenerationMyQueueCeeSheetOption } from "../lib/my-queue-cee-sheet-option";

export type { LeadGenerationMyQueueCeeSheetOption } from "../lib/my-queue-cee-sheet-option";

/**
 * Fiches CEE sur lesquelles l’agent peut se positionner pour récupérer du stock (équipes dont il est membre),
 * ou tout le référentiel si accès CEE « tout périmètre ».
 */
export async function getLeadGenerationMyQueueCeeSheetOptions(
  access: AccessContext,
): Promise<LeadGenerationMyQueueCeeSheetOption[]> {
  if (access.kind !== "authenticated") {
    return [];
  }

  const supabase = await createClient();

  if (hasFullCeeWorkflowAccess(access)) {
    const { data, error } = await supabase
      .from("cee_sheets")
      .select("id, code, label")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("code", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((s) => ({
      id: String(s.id),
      code: s.code?.trim() ?? "",
      label: s.label?.trim() ?? "",
    }));
  }

  const { data: members, error: memErr } = await supabase
    .from("cee_sheet_team_members")
    .select("cee_sheet_team_id")
    .eq("user_id", access.userId)
    .eq("is_active", true);

  if (memErr) {
    throw new Error(memErr.message);
  }

  const teamIds = [...new Set((members ?? []).map((m) => m.cee_sheet_team_id).filter(Boolean))] as string[];
  if (teamIds.length === 0) {
    return [];
  }

  const { data: teams, error: teamErr } = await supabase
    .from("cee_sheet_teams")
    .select("cee_sheet_id")
    .in("id", teamIds)
    .eq("is_active", true);

  if (teamErr) {
    throw new Error(teamErr.message);
  }

  const sheetIds = [...new Set((teams ?? []).map((t) => t.cee_sheet_id).filter(Boolean))] as string[];
  if (sheetIds.length === 0) {
    return [];
  }

  const { data: sheets, error: sheetErr } = await supabase
    .from("cee_sheets")
    .select("id, code, label")
    .in("id", sheetIds)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  if (sheetErr) {
    throw new Error(sheetErr.message);
  }

  return (sheets ?? []).map((s) => ({
    id: String(s.id),
    code: s.code?.trim() ?? "",
    label: s.label?.trim() ?? "",
  }));
}
