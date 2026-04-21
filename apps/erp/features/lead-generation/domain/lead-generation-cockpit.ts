/** Période d’analyse cockpit (événements, tendances, conversions période). */
export type LeadGenerationCockpitPeriod = "24h" | "7d" | "30d";

export type LeadGenerationCockpitFilters = {
  period: LeadGenerationCockpitPeriod;
  /** Filtre optionnel un agent (tableaux + jalons). */
  agentId: string | null;
};

export type LeadGenerationCockpitHealthStatus = "sain" | "sous_tension" | "critique";

export type LeadGenerationCockpitAlertSeverity = "info" | "warning" | "critical";

export type LeadGenerationCockpitAlert = {
  id: string;
  severity: LeadGenerationCockpitAlertSeverity;
  title: string;
  detail: string;
};

export type LeadGenerationCockpitSummary = {
  totalFreshStock: number;
  totalPipelineFollowUp: number;
  totalSlaWarning: number;
  totalSlaBreached: number;
  agentsSuspended: number;
  leadsConvertedLast24h: number;
  leadsConvertedLast7d: number;
  /** Variation vs fenêtre précédente de même durée (pour 24h = journée précédente, etc.). */
  leadsConvertedPeriodDelta: number | null;
  /** Total conversions sur la période sélectionnée (événements). */
  leadsConvertedInSelectedPeriod: number;
};

export type LeadGenerationCockpitPortfolioAging = {
  newUnder2h: number;
  newOver2h: number;
  contactedUnder24h: number;
  contactedOver24h: number;
  followUpDueToday: number;
  followUpOverdue: number;
};

export type LeadGenerationCockpitVelocityMetrics = {
  avgHoursAssignedToFirstContact: number | null;
  avgHoursAssignedToConversion: number | null;
  avgHoursFirstContactToConversion: number | null;
  countFirstContactUnder2h: number;
  countConvertedUnder24hFromAssign: number;
  milestonesSampleSize: number;
  /** Conversions (événements) dans la période filtre. */
  conversionsInPeriod: number;
};

export type LeadGenerationCockpitAgentBadge =
  | "top_performer"
  | "solide"
  | "sous_pression"
  | "sature"
  | "a_coacher";

/** Niveau de capacité opérationnelle (stock neuf + suivi, exclusions métier). */
export type LeadGenerationOperationalCapacityLevel = "normal" | "warning" | "blocked";

export type LeadGenerationCockpitAgentRow = {
  agentId: string;
  displayName: string;
  email: string | null;
  freshStock: number;
  pipelineBacklog: number;
  /** Volume opérationnel aligné dispatch / plafond 120 (stock neuf + suivi, hors converties / rejet / archivé). */
  operationalVolumeTotal: number;
  operationalStockNeuf: number;
  operationalSuivi: number;
  operationalCapacityLevel: LeadGenerationOperationalCapacityLevel;
  slaWarning: number;
  slaBreached: number;
  callsLogged: number;
  firstContactsInPeriod: number;
  leadsConvertedInPeriod: number;
  avgHoursToFirstContact: number | null;
  avgHoursToConversion: number | null;
  effectiveStockCap: number;
  suspendInjection: boolean;
  suspensionReason: string | null;
  badge: LeadGenerationCockpitAgentBadge;
};

export type LeadGenerationCockpitAgentCapacitySummary = {
  /** Agents avec volume opérationnel ≥ 120. */
  agentsSaturatedCount: number;
  /** Moyenne du volume opérationnel sur les agents affichés. */
  avgOperationalVolume: number | null;
};

export type LeadGenerationCockpitDispatchHealth = {
  agentsEligibleForInjection: number;
  agentsSuspended: number;
  agentsTotalSales: number;
  /** Motifs agrégés (dispatch_blocked récents). */
  topBlockReasons: Array<{ reason: string; count: number }>;
  avgEffectiveCap: number;
  stockAssignedEventsLast24h: number;
  stockAssignedEventsLast7d: number;
  dispatchBlockedEventsLast24h: number;
  dispatchBlockedEventsLast7d: number;
  dispatchResumedEventsLast24h: number;
  dispatchResumedEventsLast7d: number;
  recentDispatchTimeline: Array<{
    id: string;
    eventType: string;
    occurredAt: string;
    agentDisplayName: string;
    summary: string;
  }>;
};

export type LeadGenerationCockpitRecentEventRow = {
  id: string;
  eventType: string;
  occurredAt: string;
  agentId: string;
  agentDisplayName: string;
  assignmentId: string | null;
  metadataJson: Record<string, unknown>;
  contextLabel: string;
};

export type LeadGenerationCockpitOperationalHealth = {
  status: LeadGenerationCockpitHealthStatus;
  /** Parts sur stock actif pending (hors agent filtre si global). */
  shareBreached: number;
  shareFollowUpPipeline: number;
  agentsUnderPressure: number;
  agentsTopPerformers: number;
  signals: string[];
};
