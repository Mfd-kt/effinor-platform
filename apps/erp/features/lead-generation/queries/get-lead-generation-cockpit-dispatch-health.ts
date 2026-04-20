import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationCockpitDispatchHealth } from "../domain/lead-generation-cockpit";
import type { LeadGenerationCockpitDispatchRecentEventRpc } from "../domain/lead-generation-cockpit-rpc";
import { rpcLeadGenerationCockpitDispatchHealth } from "../lib/lead-generation-cockpit-rpc-client";

/**
 * Dispatch via RPC (`lead_generation_cockpit_dispatch_health`).
 */
export async function getLeadGenerationCockpitDispatchHealth(): Promise<LeadGenerationCockpitDispatchHealth> {
  const supabase = await createClient();
  const row = await rpcLeadGenerationCockpitDispatchHealth(supabase, {
    p_window_end: new Date().toISOString(),
  });

  const topBlockReasons = Array.isArray(row.top_block_reasons)
    ? row.top_block_reasons.map((x) => ({
        reason: typeof x.reason === "string" ? x.reason : "inconnu",
        count: typeof x.count === "number" ? x.count : 0,
      }))
    : [];

  const rawRecent = Array.isArray(row.recent_dispatch_events) ? row.recent_dispatch_events : [];
  const recentDispatchTimeline: LeadGenerationCockpitDispatchHealth["recentDispatchTimeline"] = rawRecent.map(
    (e: LeadGenerationCockpitDispatchRecentEventRpc) => ({
      id: e.id,
      eventType: e.event_type,
      occurredAt: e.occurred_at,
      agentDisplayName: e.agent_display_name,
      summary: e.summary,
    }),
  );

  return {
    agentsEligibleForInjection: row.agents_eligibles,
    agentsSuspended: row.agents_suspendus,
    agentsTotalSales: row.agents_total_sales,
    topBlockReasons,
    avgEffectiveCap: row.avg_effective_cap,
    stockAssignedEventsLast24h: row.assigned_count_24h,
    stockAssignedEventsLast7d: row.assigned_count_7d,
    dispatchBlockedEventsLast24h: row.dispatch_blocked_count_24h,
    dispatchBlockedEventsLast7d: row.dispatch_blocked_count_7d,
    dispatchResumedEventsLast24h: row.dispatch_resumed_count_24h,
    dispatchResumedEventsLast7d: row.dispatch_resumed_count_7d,
    recentDispatchTimeline,
  };
}
