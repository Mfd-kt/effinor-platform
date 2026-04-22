import type {
  CallbackPerformanceStats,
  CommercialCallbackKpis,
} from "@/features/commercial-callbacks/lib/commercial-callback-metrics";
import type { Json } from "@/types/database.types";

/** Aligné règles cockpit existantes ; l’UI affiche CRITIQUE / IMPORTANT / INFO. */
export type CommandCockpitAlertSeverity = "critical" | "warning" | "info";

export type CommandCockpitAlert = {
  id: string;
  severity: CommandCockpitAlertSeverity;
  title: string;
  message: string;
  href: string;
  actionLabel: string;
};

export type HotOpportunityRow = {
  kind: "callback" | "lead";
  id: string;
  company: string;
  score: number;
  estimatedValueEur: number | null;
  valueCents: number;
  href: string;
  phone: string | null;
  statusLabel: string;
  canConvert: boolean;
  teamId: string | null;
  sheetId: string | null;
  /** Filtre équipe : rappels. */
  assignedAgentUserId: string | null;
  /** Filtre équipe : leads. */
  createdByAgentId: string | null;
  /** Rappel en retard (filtre statut). */
  overdueCallback: boolean;
  /** Rappel avec échéance aujourd’hui (Paris), hors retard. */
  dueTodayCallback?: boolean;
  /** Dernier appel enregistré (rappels uniquement). */
  lastCallAt?: string | null;
  /** Création lead (ISO) pour prioriser les nouveaux sans traitement. */
  createdAt?: string;
};

export type CashImmediateRow = HotOpportunityRow;

export type CallbackShortRow = {
  id: string;
  company: string;
  score: number;
  href: string;
  phone: string | null;
  canConvert: boolean;
};

export type CommandCockpitCallbacks = {
  kpis: CommercialCallbackKpis;
  performance: CallbackPerformanceStats;
  overdue: CallbackShortRow[];
  critical: CallbackShortRow[];
  highValue: CallbackShortRow[];
};

export type PipelineStageLatency = {
  awaitCloserAvgDays: number | null;
  unassignedAvgDays: number | null;
  blockedAvgDays: number | null;
  /** Seuils : closer / brouillon stale */
  alerts: { id: string; message: string; href: string }[];
};

export type CommandCockpitPipeline = {
  awaitCloser: number;
  unassignedAgent: number;
  staleDrafts: number;
  docsPreparedStale: number;
  oldAgreementSent: number;
  blockedCount: number;
  sampleBlocked: {
    workflowId: string;
    leadId: string;
    companyName: string;
    status: string;
    sheetLabel: string;
    teamId: string | null;
    sheetId: string | null;
  }[];
  stageLatency: PipelineStageLatency;
};

export type AutomationHealthLevel = "ok" | "partial" | "problem";

export type CommandCockpitAutomation = {
  windowHours: number;
  totalRuns: number;
  success: number;
  skipped: number;
  failed: number;
  slackAttempts: number;
  slackFailed: number;
  emailFailed: number;
  health: AutomationHealthLevel;
  callbackAutoFollowup: {
    runs: number;
    sent: number;
    skipped: number;
    failed: number;
  };
  cronHealthy: boolean;
  recentErrors: { at: string; automationType: string; message: string | null }[];
};

export type CommandCockpitLogLine = {
  at: string;
  label: string;
  detail: string;
  severity: CommandCockpitAlertSeverity;
};

export type CockpitFilterOption = { id: string; label: string };

export type CockpitAgentPerformanceRow = {
  userId: string;
  displayName: string;
  leadsCreatedDay: number;
  leadsCreatedWeek: number;
  callbacksTreatedWeek: number;
  callbacksConvertedWeek: number;
  conversionRatePct: number | null;
  /** Événements workflow (journal V3) avec acteur = cet utilisateur, fenêtre 7 j. */
  workflowTransitionsWeek: number;
  highlight: "top" | "anomaly" | null;
};

export type CockpitCloserPerformanceRow = {
  userId: string;
  displayName: string;
  pipelineOpen: number;
  signedWeek: number;
  signatureRatePct: number | null;
  caGeneratedWeekEur: number;
  /** Médiane globale (logs) : heures entre « sent_to_closer » et « converted ». */
  medianHoursCloserStageFromLogs: number | null;
  highlight: "top" | "anomaly" | null;
};

export type CommandCockpitPerformanceDetail = {
  agents: CockpitAgentPerformanceRow[];
  closers: CockpitCloserPerformanceRow[];
};

export type CockpitAiActionType =
  | "call_callback"
  | "open_lead"
  | "assign_workflow"
  | "convert_callback"
  | "notify_user"
  | "fix_sheet"
  | "view_automation"
  | "reschedule_callback";

export type CockpitAiExecutionUiStatus = "idle" | "pending" | "success" | "failed";

/** Recommandation pilotage « IA CEO » (règles + option OpenAI). */
export type CockpitAiRecommendation = {
  id: string;
  title: string;
  description: string;
  category: "callback" | "lead" | "workflow" | "staffing" | "automation" | "config" | "cash";
  priority: "critical" | "important" | "opportunity";
  impactEuro: number | null;
  confidence: number;
  reasonCodes: string[];
  relatedEntityType: "callback" | "lead" | "workflow" | "sheet" | "user" | "system";
  relatedEntityId: string | null;
  actionLabel: string | null;
  actionHref: string | null;
  phone: string | null;
  /** Pour conversion rappel → lead depuis le cockpit. */
  canConvertCallback?: boolean;
  /** Indique si l’action « Exécuter » est proposée (dérivé des règles métier). */
  executable: boolean;
  actionType: CockpitAiActionType;
  actionPayload: Json;
  executionStatus: CockpitAiExecutionUiStatus;
  executionMessage: string | null;
};

/** Indices pour des actions cockpit nécessitant un contexte frais (ex. assignation suggérée). */
export type CockpitAiExecutionHints = {
  autoAssignAgent: { workflowId: string; agentUserId: string } | null;
};

export type CockpitHumanAnomaly = {
  id: string;
  userId: string;
  displayName: string;
  email: string | null;
  role: "agent" | "closer";
  problem: string;
  level: "critique" | "warning";
  dossiersHref: string;
  priorityScore: number;
};

export type WorkflowLogMetricsSummary = {
  closerMedianHours: number | null;
  conversionRateFromLogsPct: number | null;
  conversionNumerator: number;
  conversionDenominator: number;
};

export type WorkflowJournalPreviewLine = {
  at: string;
  eventType: string;
  leadId: string;
  fromStatus: string | null;
  toStatus: string;
};

/** SLA internes (moteur cron) — synthèse direction. */
export type CommandCockpitSlaWorstRow = {
  id: string;
  ruleCode: string;
  ruleName: string;
  entityType: string;
  entityId: string;
  status: string;
  minutesLate: number;
  href: string;
};

export type CommandCockpitInternalSlaBlock = {
  timezone: "Europe/Paris";
  totals: {
    warning: number;
    breached: number;
    critical: number;
    resolvedTodayParis: number;
  };
  worst: CommandCockpitSlaWorstRow[];
};

/** Activité de l’orchestrateur IA (logs service) — visible direction uniquement. */
export type CockpitAiOrchestratorActivity = {
  /** Fenêtre glissante 24 h (UTC). */
  executed24h: number;
  failed24h: number;
  pending24h: number;
  recent: Array<{
    id: string;
    recommendationId: string;
    actionType: string;
    status: string;
    createdAt: string;
    reason: string | null;
    errorMessage: string | null;
  }>;
};

export type CommandCockpitData = {
  aiExecutionHints: CockpitAiExecutionHints;
  aiRecommendations: CockpitAiRecommendation[];
  aiRecommendationsMeta: { heuristicOnly: boolean };
  /** Synthèse exécutions auto (si chargée). */
  aiOrchestratorActivity: CockpitAiOrchestratorActivity | null;
  /** Fiches actives sans équipe (réseau). */
  sheetsWithoutTeam: { sheetId: string; label: string }[];
  /** Simulateurs remplis sur les dernières 24 h (leads « new » chargés). */
  hotSimulatedLeads24h: number;
  /** Dossiers « bloqués / stale » agrégés par libellé de fiche. */
  workflowStuckBySheet: { label: string; count: number }[];
  humanAnomalies: CockpitHumanAnomaly[];
  workflowLogMetrics: WorkflowLogMetricsSummary;
  workflowJournalPreview: WorkflowJournalPreviewLine[];
  cashImmediate: CashImmediateRow[];
  filterOptions: {
    teams: CockpitFilterOption[];
    sheets: CockpitFilterOption[];
  };
  /** Pour filtre « équipe » : membres actifs par équipe CEE. */
  teamMembersByTeam: Record<string, string[]>;
  alerts: CommandCockpitAlert[];
  opportunities: HotOpportunityRow[];
  callbacks: CommandCockpitCallbacks;
  pipeline: CommandCockpitPipeline;
  automation: CommandCockpitAutomation;
  logs: { lines: CommandCockpitLogLine[] };
  performance: CommandCockpitPerformanceDetail;
  internalSla: CommandCockpitInternalSlaBlock | null;
};
