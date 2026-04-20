import { createClient } from "@/lib/supabase/server";

import type {
  LeadGenerationCockpitFilters,
  LeadGenerationCockpitRecentEventRow,
} from "../domain/lead-generation-cockpit";
import { getLeadGenerationCockpitRpcWindows } from "../lib/lead-generation-cockpit-rpc-windows";
import { rpcLeadGenerationCockpitRecentEvents } from "../lib/lead-generation-cockpit-rpc-client";

function contextFromMeta(meta: Record<string, unknown>): string {
  const reason = meta.reason;
  if (typeof reason === "string" && reason.trim()) {
    return reason.trim();
  }
  const stock = meta.lead_generation_stock_id ?? meta.stock_id;
  if (typeof stock === "string") {
    return `Fiche ${stock.slice(0, 8)}…`;
  }
  return "—";
}

/**
 * Flux récent via RPC (`lead_generation_cockpit_recent_events`).
 */
export async function getLeadGenerationCockpitRecentEvents(
  filters: LeadGenerationCockpitFilters,
): Promise<LeadGenerationCockpitRecentEventRow[]> {
  const supabase = await createClient();
  const w = getLeadGenerationCockpitRpcWindows(filters.period, new Date());

  const rows = await rpcLeadGenerationCockpitRecentEvents(supabase, {
    p_agent_id: filters.agentId,
    p_window_start: w.periodStart,
    p_window_end: w.windowEnd,
    p_limit: 40,
  });

  return rows.map((r) => {
    const meta = (r.metadata_json ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      eventType: r.event_type,
      occurredAt: r.occurred_at,
      agentId: r.agent_id,
      agentDisplayName: r.agent_display_name,
      assignmentId: r.assignment_id,
      metadataJson: meta,
      contextLabel: contextFromMeta(meta),
    };
  });
}
