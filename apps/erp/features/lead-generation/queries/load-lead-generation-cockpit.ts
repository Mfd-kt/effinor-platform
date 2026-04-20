import type {
  LeadGenerationCockpitAlert,
  LeadGenerationCockpitFilters,
  LeadGenerationCockpitOperationalHealth,
  LeadGenerationCockpitRecentEventRow,
} from "../domain/lead-generation-cockpit";
import {
  computeLeadGenerationCockpitAlerts,
  computeLeadGenerationCockpitOperationalHealth,
} from "../lib/compute-lead-generation-cockpit-health";
import { getLeadGenerationCockpitAgentTable } from "./get-lead-generation-cockpit-agent-table";
import { getLeadGenerationCockpitDispatchHealth } from "./get-lead-generation-cockpit-dispatch-health";
import { getLeadGenerationCockpitPortfolioAging } from "./get-lead-generation-cockpit-portfolio-aging";
import { getLeadGenerationCockpitRecentEvents } from "./get-lead-generation-cockpit-recent-events";
import { getLeadGenerationCockpitSummary } from "./get-lead-generation-cockpit-summary";
import { getLeadGenerationCockpitVelocityMetrics } from "./get-lead-generation-cockpit-velocity-metrics";

export type LeadGenerationCockpitData = {
  filters: LeadGenerationCockpitFilters;
  summary: Awaited<ReturnType<typeof getLeadGenerationCockpitSummary>>;
  portfolioAging: Awaited<ReturnType<typeof getLeadGenerationCockpitPortfolioAging>>;
  velocity: Awaited<ReturnType<typeof getLeadGenerationCockpitVelocityMetrics>>;
  agentRows: Awaited<ReturnType<typeof getLeadGenerationCockpitAgentTable>>;
  dispatchHealth: Awaited<ReturnType<typeof getLeadGenerationCockpitDispatchHealth>>;
  recentEvents: LeadGenerationCockpitRecentEventRow[];
  operationalHealth: LeadGenerationCockpitOperationalHealth;
  alerts: LeadGenerationCockpitAlert[];
};

/**
 * Orchestration cockpit : requêtes parallèles (RPC Postgres), aucun chargement massif de jalons côté app.
 */
export async function loadLeadGenerationCockpit(filters: LeadGenerationCockpitFilters): Promise<LeadGenerationCockpitData> {
  const [summary, portfolioAging, velocity, agentRows, dispatchHealth, recentEvents] = await Promise.all([
    getLeadGenerationCockpitSummary(filters),
    getLeadGenerationCockpitPortfolioAging(filters),
    getLeadGenerationCockpitVelocityMetrics(filters),
    getLeadGenerationCockpitAgentTable(filters),
    getLeadGenerationCockpitDispatchHealth(),
    getLeadGenerationCockpitRecentEvents(filters),
  ]);

  const operationalHealth = computeLeadGenerationCockpitOperationalHealth({
    summary,
    portfolioAging,
    agentRows,
    velocity,
  });
  const alerts = computeLeadGenerationCockpitAlerts({ summary, portfolioAging, agentRows });

  return {
    filters,
    summary,
    portfolioAging,
    velocity,
    agentRows,
    dispatchHealth,
    recentEvents,
    operationalHealth,
    alerts,
  };
}
