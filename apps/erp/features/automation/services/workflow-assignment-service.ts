import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

export type UserLoad = { userId: string; load: number };

/** Charge = nombre de workflows non archivés encore « en cours » pour ce rôle. */
export async function computeAssignmentLoad(
  supabase: Supabase,
  userId: string,
  role: "confirmateur" | "closer",
): Promise<number> {
  const col =
    role === "confirmateur" ? "assigned_confirmateur_user_id" : "assigned_closer_user_id";
  const statuses =
    role === "confirmateur"
      ? ["to_confirm", "simulation_done"]
      : ["to_close", "agreement_sent", "quote_pending"];

  const { count, error } = await supabase
    .from("lead_sheet_workflows")
    .select("id", { count: "exact", head: true })
    .eq(col, userId)
    .eq("is_archived", false)
    .in("workflow_status", statuses);

  if (error) {
    console.warn("[automation] computeAssignmentLoad:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function computeAssignmentLoadsForUsers(
  supabase: Supabase,
  userIds: string[],
  role: "confirmateur" | "closer",
): Promise<UserLoad[]> {
  const loads = await Promise.all(
    userIds.map(async (userId) => ({
      userId,
      load: await computeAssignmentLoad(supabase, userId, role),
    })),
  );
  return loads.sort((a, b) => a.load - b.load || a.userId.localeCompare(b.userId));
}

export function pickLeastLoadedUser(loads: UserLoad[]): string | null {
  if (loads.length === 0) return null;
  const sorted = [...loads].sort((a, b) => a.load - b.load || a.userId.localeCompare(b.userId));
  return sorted[0].userId;
}
