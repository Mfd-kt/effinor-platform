import { createClient } from "@/lib/supabase/server";

import type {
  LeadGenerationCockpitAgentBadge,
  LeadGenerationCockpitAgentCapacitySummary,
  LeadGenerationCockpitAgentRow,
  LeadGenerationCockpitFilters,
  LeadGenerationOperationalCapacityLevel,
} from "../domain/lead-generation-cockpit";
import type { AgentCommercialCapacitySnapshot } from "../lib/agent-commercial-capacity";
import { computeCommercialCapacityForAgents } from "../lib/agent-commercial-capacity";
import { getLeadGenerationCockpitRpcWindows } from "../lib/lead-generation-cockpit-rpc-windows";
import { rpcLeadGenerationCockpitAgentRows } from "../lib/lead-generation-cockpit-rpc-client";

function secondsToHours(s: number | null): number | null {
  if (s == null || !Number.isFinite(s)) {
    return null;
  }
  return s / 3600;
}

function computeCockpitAgentBadge(input: {
  suspendInjection: boolean;
  slaBreached: number;
  slaWarning: number;
  pipelineBacklog: number;
  freshStock: number;
  leadsConvertedInPeriod: number;
  avgHoursToFirstContact: number | null;
}): LeadGenerationCockpitAgentBadge {
  if (input.suspendInjection) {
    return "sature";
  }
  if (input.slaBreached >= 12 || input.pipelineBacklog >= 65) {
    return "sous_pression";
  }
  if (
    input.leadsConvertedInPeriod >= 2 &&
    (input.avgHoursToFirstContact ?? 99) <= 3.5 &&
    input.slaBreached <= 4
  ) {
    return "top_performer";
  }
  if (input.freshStock >= 8 && input.leadsConvertedInPeriod === 0 && (input.avgHoursToFirstContact ?? 0) > 10) {
    return "a_coacher";
  }
  if (input.slaWarning + input.slaBreached >= 12 || input.pipelineBacklog >= 38) {
    return "sous_pression";
  }
  return "solide";
}

function summarizeOperationalCapacity(rows: LeadGenerationCockpitAgentRow[]): LeadGenerationCockpitAgentCapacitySummary {
  if (rows.length === 0) {
    return { agentsSaturatedCount: 0, avgOperationalVolume: null };
  }
  let saturated = 0;
  let sum = 0;
  for (const r of rows) {
    sum += r.operationalVolumeTotal;
    if (r.operationalCapacityLevel === "blocked") {
      saturated += 1;
    }
  }
  return {
    agentsSaturatedCount: saturated,
    avgOperationalVolume: Math.round((sum / rows.length) * 10) / 10,
  };
}

/**
 * Tableau agents via RPC (`lead_generation_cockpit_agent_rows`) — badge calculé en TS (règles inchangées).
 * Volumes opérationnels (plafond 120) enrichis via jointure stock (exclusions métier).
 */
export async function getLeadGenerationCockpitAgentTable(
  filters: LeadGenerationCockpitFilters,
): Promise<{ rows: LeadGenerationCockpitAgentRow[]; capacitySummary: LeadGenerationCockpitAgentCapacitySummary }> {
  const supabase = await createClient();
  const w = getLeadGenerationCockpitRpcWindows(filters.period, new Date());

  const rows = await rpcLeadGenerationCockpitAgentRows(supabase, {
    p_agent_id: filters.agentId,
    p_window_start: w.periodStart,
    p_window_end: w.windowEnd,
  });

  let capacityMap = new Map<string, AgentCommercialCapacitySnapshot>();
  try {
    capacityMap = await computeCommercialCapacityForAgents(
      supabase,
      rows.map((r) => r.agent_id),
    );
  } catch {
    capacityMap = new Map();
  }

  const out: LeadGenerationCockpitAgentRow[] = rows.map((r) => {
    const freshStock = r.stock_neuf;
    const pipelineBacklog = r.suivi_total;
    const cap = capacityMap.get(r.agent_id);
    const operationalStockNeuf = cap?.stockNeuf ?? freshStock;
    const operationalSuivi = cap?.suivi ?? pipelineBacklog;
    const operationalVolumeTotal = cap?.total ?? freshStock + pipelineBacklog;
    const operationalCapacityLevel: LeadGenerationOperationalCapacityLevel = cap?.level ?? "normal";
    const slaWarning = r.sla_warning;
    const slaBreached = r.sla_breached;
    const avgHoursToFirstContact = secondsToHours(r.avg_assignment_to_first_contact_seconds);
    const avgHoursToConversion = secondsToHours(r.avg_assignment_to_conversion_seconds);
    const badge = computeCockpitAgentBadge({
      suspendInjection: r.injection_suspended,
      slaBreached,
      slaWarning,
      pipelineBacklog,
      freshStock,
      leadsConvertedInPeriod: r.converted_total,
      avgHoursToFirstContact,
    });
    return {
      agentId: r.agent_id,
      displayName: r.agent_name,
      email: r.agent_email,
      freshStock,
      pipelineBacklog,
      operationalVolumeTotal,
      operationalStockNeuf,
      operationalSuivi,
      operationalCapacityLevel,
      slaWarning,
      slaBreached,
      callsLogged: r.appels_total,
      firstContactsInPeriod: r.first_contacts_total,
      leadsConvertedInPeriod: r.converted_total,
      avgHoursToFirstContact,
      avgHoursToConversion,
      effectiveStockCap: r.effective_stock_cap,
      suspendInjection: r.injection_suspended,
      suspensionReason: r.suspension_reason,
      badge,
    };
  });

  const sorted = out.sort(
    (x, y) => y.leadsConvertedInPeriod - x.leadsConvertedInPeriod || x.displayName.localeCompare(y.displayName, "fr"),
  );
  return { rows: sorted, capacitySummary: summarizeOperationalCapacity(sorted) };
}
