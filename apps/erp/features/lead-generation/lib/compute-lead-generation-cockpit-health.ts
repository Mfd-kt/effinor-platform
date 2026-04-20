import type {
  LeadGenerationCockpitAlert,
  LeadGenerationCockpitAgentRow,
  LeadGenerationCockpitOperationalHealth,
  LeadGenerationCockpitPortfolioAging,
  LeadGenerationCockpitSummary,
  LeadGenerationCockpitVelocityMetrics,
} from "../domain/lead-generation-cockpit";

/**
 * Règles de statut global (ajuster les seuils ici uniquement).
 *
 * - **critique** : retards massifs, injection coupée pour une part importante des agents,
 *   ou stock neuf qui vieillit trop.
 * - **sous_tension** : signaux intermédiaires (retards, suivi, suspensions).
 * - **sain** : sinon.
 */
const BREACH_SHARE_CRITICAL = 0.2;
const BREACH_SHARE_WARNING = 0.08;
const SUSPENDED_SHARE_CRITICAL = 0.35;
const SUSPENDED_SHARE_WARNING = 0.12;
const FOLLOWUP_SHARE_WARNING = 0.58;
const NEW_STALE_SHARE_CRITICAL = 0.45;

export function computeLeadGenerationCockpitOperationalHealth(input: {
  summary: LeadGenerationCockpitSummary;
  portfolioAging: LeadGenerationCockpitPortfolioAging;
  agentRows: LeadGenerationCockpitAgentRow[];
  velocity: LeadGenerationCockpitVelocityMetrics;
}): LeadGenerationCockpitOperationalHealth {
  const { summary, portfolioAging, agentRows, velocity } = input;

  const pendingPortfolio = Math.max(
    0,
    summary.totalFreshStock +
      summary.totalPipelineFollowUp,
  );
  const shareBreached = pendingPortfolio > 0 ? summary.totalSlaBreached / pendingPortfolio : 0;
  const shareFollowUpPipeline =
    pendingPortfolio > 0 ? summary.totalPipelineFollowUp / pendingPortfolio : 0;

  const agentsTotal = agentRows.length;
  const agentsUnderPressure = agentRows.filter((r) =>
    ["sous_pression", "sature", "a_coacher"].includes(r.badge),
  ).length;
  const agentsTopPerformers = agentRows.filter((r) => r.badge === "top_performer").length;

  const suspendedShare = agentsTotal > 0 ? summary.agentsSuspended / agentsTotal : 0;
  const fresh = Math.max(1, summary.totalFreshStock);
  const newStaleShare = summary.totalFreshStock > 0 ? portfolioAging.newOver2h / fresh : 0;

  const signals: string[] = [];
  if (shareBreached >= BREACH_SHARE_WARNING) {
    signals.push(
      `Part SLA dépassé élevée (${(shareBreached * 100).toFixed(0)} % du portefeuille actif).`,
    );
  }
  if (suspendedShare >= SUSPENDED_SHARE_WARNING) {
    signals.push(
      `Injection suspendue pour ${summary.agentsSuspended} agent(s) (${(suspendedShare * 100).toFixed(0)} %).`,
    );
  }
  if (shareFollowUpPipeline >= FOLLOWUP_SHARE_WARNING) {
    signals.push(
      `Fort poids du suivi (${(shareFollowUpPipeline * 100).toFixed(0)} % du portefeuille).`,
    );
  }
  if (newStaleShare >= 0.25) {
    signals.push(`Stock neuf vieillissant (${portfolioAging.newOver2h} fiches > 2 h).`);
  }
  if (
    velocity.avgHoursAssignedToFirstContact != null &&
    velocity.avgHoursAssignedToFirstContact > 6
  ) {
    signals.push(
      `Délai moyen jusqu’au 1er contact élevé (${velocity.avgHoursAssignedToFirstContact.toFixed(1)} h).`,
    );
  }

  let status: LeadGenerationCockpitOperationalHealth["status"] = "sain";
  if (
    shareBreached >= BREACH_SHARE_CRITICAL ||
    suspendedShare >= SUSPENDED_SHARE_CRITICAL ||
    newStaleShare >= NEW_STALE_SHARE_CRITICAL
  ) {
    status = "critique";
  } else if (
    shareBreached >= BREACH_SHARE_WARNING ||
    suspendedShare >= SUSPENDED_SHARE_WARNING ||
    shareFollowUpPipeline >= FOLLOWUP_SHARE_WARNING ||
    newStaleShare >= 0.35
  ) {
    status = "sous_tension";
  }

  return {
    status,
    shareBreached,
    shareFollowUpPipeline,
    agentsUnderPressure,
    agentsTopPerformers,
    signals,
  };
}

function alertId(parts: string[]): string {
  return parts.join("-");
}

/**
 * Alertes actionnables : seuils métier centralisés (même esprit que la politique dispatch).
 */
export function computeLeadGenerationCockpitAlerts(input: {
  summary: LeadGenerationCockpitSummary;
  portfolioAging: LeadGenerationCockpitPortfolioAging;
  agentRows: LeadGenerationCockpitAgentRow[];
}): LeadGenerationCockpitAlert[] {
  const { summary, portfolioAging, agentRows } = input;
  const out: LeadGenerationCockpitAlert[] = [];

  if (portfolioAging.newOver2h >= 5) {
    out.push({
      id: alertId(["new", "stale"]),
      severity: portfolioAging.newOver2h >= 20 ? "critical" : "warning",
      title: "Stock neuf trop ancien",
      detail: `${portfolioAging.newOver2h} fiche(s) en « Nouveau » depuis plus de 2 h — prioriser le premier contact.`,
    });
  }

  if (portfolioAging.followUpOverdue >= 3) {
    out.push({
      id: alertId(["followup", "overdue"]),
      severity: portfolioAging.followUpOverdue >= 15 ? "critical" : "warning",
      title: "Relances « À rappeler » en retard",
      detail: `${portfolioAging.followUpOverdue} fiche(s) avec relance dépassée.`,
    });
  }

  if (summary.agentsSuspended >= 1) {
    out.push({
      id: alertId(["dispatch", "suspended"]),
      severity: summary.agentsSuspended >= 3 ? "critical" : "warning",
      title: "Injection suspendue",
      detail: `${summary.agentsSuspended} agent(s) ne reçoivent plus de stock neuf (politique dispatch).`,
    });
  }

  const highBreachAgents = agentRows.filter((r) => r.slaBreached > 12);
  if (highBreachAgents.length > 0) {
    out.push({
      id: alertId(["sla", "agents", "breach"]),
      severity: highBreachAgents.length >= 3 ? "critical" : "warning",
      title: "SLA dépassés concentrés",
      detail: `${highBreachAgents.length} agent(s) avec plus de 12 échéances en retard : ${highBreachAgents
        .slice(0, 4)
        .map((a) => a.displayName)
        .join(", ")}${highBreachAgents.length > 4 ? "…" : ""}.`,
    });
  }

  const backlogSpike = agentRows.filter((r) => r.pipelineBacklog >= 40);
  if (backlogSpike.length > 0) {
    out.push({
      id: alertId(["backlog", "spike"]),
      severity: "warning",
      title: "Suivi très chargé",
      detail: `${backlogSpike.length} agent(s) avec ≥ 40 fiches en suivi (contacté / à rappeler).`,
    });
  }

  const coach = agentRows.filter((r) => r.badge === "a_coacher");
  if (coach.length > 0) {
    out.push({
      id: alertId(["coaching"]),
      severity: "info",
      title: "Agents à coacher",
      detail: `${coach.length} agent(s) avec faible transformation malgré du volume — ${coach
        .slice(0, 3)
        .map((c) => c.displayName)
        .join(", ")}${coach.length > 3 ? "…" : ""}.`,
    });
  }

  return out;
}
