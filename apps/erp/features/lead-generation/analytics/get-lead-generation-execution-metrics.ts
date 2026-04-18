import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

const ACTIVE_ASSIGNMENT_STATUSES = ["assigned", "opened", "in_progress"];

export type LeadGenerationExecutionMetrics = {
  totalAssignments: number;
  activeAssignments: number;
  recycledAssignments: number;
  totalActivities: number;
  assignmentsWithActivity: number;
  assignmentsWithoutActivity: number;
  overdueFollowUps: number;
};

export async function getLeadGenerationExecutionMetrics(): Promise<LeadGenerationExecutionMetrics> {
  const supabase = await createClient();
  const assignments = lgTable(supabase, "lead_generation_assignments");
  const activities = lgTable(supabase, "lead_generation_assignment_activities");
  const nowIso = new Date().toISOString();

  const [
    totalAssignmentsRes,
    activeAssignmentsRes,
    recycledAssignmentsRes,
    totalActivitiesRes,
    assignmentIdsRes,
    overdueFollowUpsRes,
  ] = await Promise.all([
    assignments.select("id", { count: "exact", head: true }),
    assignments
      .select("id", { count: "exact", head: true })
      .in("assignment_status", ACTIVE_ASSIGNMENT_STATUSES)
      .eq("outcome", "pending"),
    assignments.select("id", { count: "exact", head: true }).eq("assignment_status", "recycled"),
    activities.select("id", { count: "exact", head: true }),
    activities.select("assignment_id"),
    activities.select("id", { count: "exact", head: true }).lt("next_action_at", nowIso),
  ]);

  for (const res of [
    totalAssignmentsRes,
    activeAssignmentsRes,
    recycledAssignmentsRes,
    totalActivitiesRes,
    assignmentIdsRes,
    overdueFollowUpsRes,
  ]) {
    if (res.error) {
      throw new Error(`Metrics exécution lead-generation: ${res.error.message}`);
    }
  }

  const totalAssignments = totalAssignmentsRes.count ?? 0;
  const assignmentsWithActivity = new Set(
    ((assignmentIdsRes.data ?? []) as Array<{ assignment_id: string | null }>)
      .map((r) => r.assignment_id)
      .filter((v): v is string => typeof v === "string" && v.length > 0),
  ).size;

  return {
    totalAssignments,
    activeAssignments: activeAssignmentsRes.count ?? 0,
    recycledAssignments: recycledAssignmentsRes.count ?? 0,
    totalActivities: totalActivitiesRes.count ?? 0,
    assignmentsWithActivity,
    assignmentsWithoutActivity: Math.max(0, totalAssignments - assignmentsWithActivity),
    overdueFollowUps: overdueFollowUpsRes.count ?? 0,
  };
}
