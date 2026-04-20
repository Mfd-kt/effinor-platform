import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationCockpitFilters, LeadGenerationCockpitVelocityMetrics } from "../domain/lead-generation-cockpit";
import { getLeadGenerationCockpitRpcWindows } from "../lib/lead-generation-cockpit-rpc-windows";
import { rpcLeadGenerationCockpitVelocityMetrics } from "../lib/lead-generation-cockpit-rpc-client";

function secondsToHours(s: number | null): number | null {
  if (s == null || !Number.isFinite(s)) {
    return null;
  }
  return s / 3600;
}

/**
 * Vélocité via RPC (`lead_generation_cockpit_velocity_metrics`) — jalons + journal conversions.
 */
export async function getLeadGenerationCockpitVelocityMetrics(
  filters: LeadGenerationCockpitFilters,
): Promise<LeadGenerationCockpitVelocityMetrics> {
  const supabase = await createClient();
  const now = new Date();
  const w = getLeadGenerationCockpitRpcWindows(filters.period, now);

  const row = await rpcLeadGenerationCockpitVelocityMetrics(supabase, {
    p_agent_id: filters.agentId,
    p_window_start: w.periodStart,
    p_window_end: w.windowEnd,
  });

  return {
    avgHoursAssignedToFirstContact: secondsToHours(row.avg_assignment_to_first_contact_seconds),
    avgHoursAssignedToConversion: secondsToHours(row.avg_assignment_to_conversion_seconds),
    avgHoursFirstContactToConversion: secondsToHours(row.avg_first_contact_to_conversion_seconds),
    countFirstContactUnder2h: row.first_contact_within_2h_count,
    countConvertedUnder24hFromAssign: row.converted_within_24h_from_assign_count,
    milestonesSampleSize: row.milestones_sample_size,
    conversionsInPeriod: row.conversions_in_period,
  };
}
