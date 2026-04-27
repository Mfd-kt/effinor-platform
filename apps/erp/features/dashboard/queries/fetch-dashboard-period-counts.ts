import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/** Totaux sur une plage [start, end) — mêmes métriques que « Aujourd'hui ». */
export type DashboardTodayCounts = {
  leadsCreated: number;
  callbacks: number;
  technicalVisits: number;
};

export async function countLeadsCreatedInRange(
  supabase: SupabaseClient<Database>,
  leadIds: string[] | "all",
  startIso: string,
  endIso: string,
): Promise<number> {
  if (leadIds !== "all" && leadIds.length === 0) {
    return 0;
  }
  let q = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .gte("created_at", startIso)
    .lt("created_at", endIso);
  if (leadIds !== "all") {
    q = q.in("id", leadIds);
  }
  const { count, error } = await q;
  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

/** Mêmes règles que « Aujourd’hui » du tableau de bord, sur une plage [startIso, endIso) (Paris). */
export async function fetchDashboardPeriodCounts(
  supabase: SupabaseClient<Database>,
  leadIds: string[] | "all",
  startIso: string,
  endIso: string,
): Promise<DashboardTodayCounts> {
  if (leadIds !== "all" && leadIds.length === 0) {
    return { leadsCreated: 0, callbacks: 0, technicalVisits: 0 };
  }

  const leadCountBase = () => {
    let q = supabase.from("leads").select("id", { count: "exact", head: true }).is("deleted_at", null);
    if (leadIds !== "all") {
      q = q.in("id", leadIds);
    }
    return q;
  };

  const vtIdBase = () => {
    let q = supabase.from("technical_visits").select("id").is("deleted_at", null);
    if (leadIds !== "all") {
      q = q.in("lead_id", leadIds);
    }
    return q;
  };

  const [
    leadsTodayCreatedRes,
    leadsTodayCallbackRes,
    vtScheduledIdsRes,
    vtCreatedIdsRes,
  ] = await Promise.all([
    leadCountBase().gte("created_at", startIso).lt("created_at", endIso),
    leadCountBase()
      .not("callback_at", "is", null)
      .gte("callback_at", startIso)
      .lt("callback_at", endIso),
    vtIdBase()
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", startIso)
      .lt("scheduled_at", endIso),
    vtIdBase().gte("created_at", startIso).lt("created_at", endIso),
  ]);

  const firstErr =
    leadsTodayCreatedRes.error ??
    leadsTodayCallbackRes.error ??
    vtScheduledIdsRes.error ??
    vtCreatedIdsRes.error;
  if (firstErr) {
    throw new Error(firstErr.message);
  }

  const vtScheduledRows = (vtScheduledIdsRes.data ?? []) as { id: string }[];
  const vtCreatedRows = (vtCreatedIdsRes.data ?? []) as { id: string }[];
  const vtIdSet = new Set<string>();
  for (const r of vtScheduledRows) vtIdSet.add(r.id);
  for (const r of vtCreatedRows) vtIdSet.add(r.id);
  const technicalVisits = vtIdSet.size;

  return {
    leadsCreated: leadsTodayCreatedRes.count ?? 0,
    callbacks: leadsTodayCallbackRes.count ?? 0,
    technicalVisits,
  };
}
