import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationCockpitFilters, LeadGenerationCockpitSummary } from "../domain/lead-generation-cockpit";
import { getLeadGenerationCockpitRpcWindows } from "../lib/lead-generation-cockpit-rpc-windows";
import { rpcLeadGenerationCockpitSummary } from "../lib/lead-generation-cockpit-rpc-client";

/**
 * Agrégats portefeuille + conversions via RPC Postgres (`lead_generation_cockpit_summary`).
 */
export async function getLeadGenerationCockpitSummary(
  filters: LeadGenerationCockpitFilters,
): Promise<LeadGenerationCockpitSummary> {
  const supabase = await createClient();
  const now = new Date();
  const w = getLeadGenerationCockpitRpcWindows(filters.period, now);

  const row = await rpcLeadGenerationCockpitSummary(supabase, {
    p_agent_id: filters.agentId,
    p_window_end: w.windowEnd,
    p_period_start: w.periodStart,
    p_prev_period_start: w.prevPeriodStart,
  });

  const leadsConvertedPeriodDelta = row.conversions_period - row.conversions_previous_period;

  return {
    totalFreshStock: row.stock_neuf_total,
    totalPipelineFollowUp: row.suivi_total,
    totalSlaWarning: row.sla_warning_total,
    totalSlaBreached: row.sla_breached_total,
    agentsSuspended: row.agents_suspendus_total,
    leadsConvertedLast24h: row.conversions_24h,
    leadsConvertedLast7d: row.conversions_7d,
    leadsConvertedPeriodDelta: Number.isFinite(leadsConvertedPeriodDelta) ? leadsConvertedPeriodDelta : null,
    leadsConvertedInSelectedPeriod: row.conversions_period,
  };
}
