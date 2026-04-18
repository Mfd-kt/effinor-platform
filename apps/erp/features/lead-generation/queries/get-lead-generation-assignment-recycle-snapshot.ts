import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

export type LeadGenerationAssignmentRecycleSnapshot = {
  id: string;
  recycle_status: string;
  recycle_reason: string | null;
  recycle_eligible_at: string | null;
  recycled_count: number;
  last_recycled_at: string | null;
};

export async function getLeadGenerationAssignmentRecycleSnapshot(
  assignmentId: string | null,
): Promise<LeadGenerationAssignmentRecycleSnapshot | null> {
  if (!assignmentId) {
    return null;
  }
  const supabase = await createClient();
  const t = lgTable(supabase, "lead_generation_assignments");
  const { data, error } = await t
    .select("id, recycle_status, recycle_reason, recycle_eligible_at, recycled_count, last_recycled_at")
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Assignation recyclage : ${error.message}`);
  }
  if (!data) {
    return null;
  }
  return data as LeadGenerationAssignmentRecycleSnapshot;
}
