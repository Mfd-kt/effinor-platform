/** Contexte compact pour règles métier et optionnellement OpenAI (aucune PII superflue). */
export type CockpitAiContext = {
  generatedAt: string;
  summary: {
    overdueCallbacks: number;
    criticalBandCallbacks: number;
    hotSimulatedLeads24h: number;
    unassignedWorkflows: number;
    totalBacklogConfirmateur: number;
    pipelineCloserOpen: number;
    automationFailed48h: number;
    cronHealthy: boolean;
    automationHealth: "ok" | "partial" | "problem";
    cashTopValueEur: number | null;
  };
  topCallbacks: {
    id: string;
    company: string;
    score: number;
    valueEur: number | null;
    overdue: boolean;
    dueToday: boolean;
    neverCalled: boolean;
    phone: string | null;
    canConvert: boolean;
  }[];
  overdueHighValue: { count: number; sumValueEur: number };
  topHotLeads: {
    id: string;
    company: string;
    valueEur: number | null;
    phone: string | null;
    statusLabel: string;
    createdAt: string;
  }[];
  criticalAlerts: { id: string; title: string; href: string; message: string }[];
  sheetsWithoutTeam: { sheetId: string; label: string }[];
  workflowStuckBySheet: { label: string; count: number }[];
  humanAnomaliesTop: {
    id: string;
    role: string;
    displayName: string;
    level: string;
    problem: string;
    userId: string;
  }[];
  confirmateurBacklogs: { userId: string; name: string; backlog: number }[];
  closerLoads: {
    userId: string;
    name: string;
    pipelineOpen: number;
    signedWeek: number;
    signatureRatePct: number | null;
  }[];
  workflowLog: {
    confirmateurMedianH: number | null;
    closerMedianH: number | null;
    conversionPct: number | null;
  };
  automation: {
    callbackFollowupFailed: number;
    slackFailed: number;
    emailFailed: number;
  };
  /** Leads « Nouveau » à traiter en priorité (cash / qualification). */
  newLeadsNeedAction: { id: string; company: string; phone: string | null; createdAt: string }[];
  /** SLA internes (Europe/Paris — jour « résolus aujourd’hui »). */
  internalSla: {
    warning: number;
    breached: number;
    critical: number;
    resolvedTodayParis: number;
    topRuleCodes: string[];
  } | null;
};

export type CockpitAiPrioritySignals = {
  valueCents?: number;
  overdue?: boolean;
  /** Échéance aujourd’hui (hors retard) — cash immédiat. */
  dueTodayCallback?: boolean;
  /** Jamais d’appel enregistré sur le rappel. */
  callbackNeverCalled?: boolean;
  callbackScore?: number;
  automationCritical?: boolean;
  cronUnhealthy?: boolean;
  staffingCritical?: boolean;
  configBlocksWorkflows?: number;
  batchCount?: number;
  pipelineBlocked?: boolean;
  slaHoursExcess?: boolean;
  alertCritical?: boolean;
  proximityConversion?: boolean;
  /** Instances SLA en critique ou dépassement. */
  slaInternalCriticalCount?: number;
  slaBreachedCount?: number;
};
