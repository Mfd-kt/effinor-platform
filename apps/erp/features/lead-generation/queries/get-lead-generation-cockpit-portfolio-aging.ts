import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationCockpitFilters, LeadGenerationCockpitPortfolioAging } from "../domain/lead-generation-cockpit";
import { rpcLeadGenerationCockpitPortfolioAging } from "../lib/lead-generation-cockpit-rpc-client";

/**
 * Vieillissement portefeuille via RPC (`lead_generation_cockpit_portfolio_aging`) — jour civil Paris pour les relances.
 */
export async function getLeadGenerationCockpitPortfolioAging(
  filters: LeadGenerationCockpitFilters,
): Promise<LeadGenerationCockpitPortfolioAging> {
  const supabase = await createClient();
  const row = await rpcLeadGenerationCockpitPortfolioAging(supabase, {
    p_agent_id: filters.agentId,
    p_now: new Date().toISOString(),
  });

  return {
    newUnder2h: row.new_lt_2h,
    newOver2h: row.new_gt_2h,
    contactedUnder24h: row.contacted_lt_24h,
    contactedOver24h: row.contacted_gt_24h,
    followUpDueToday: row.follow_up_due_today,
    followUpOverdue: row.follow_up_overdue,
  };
}
