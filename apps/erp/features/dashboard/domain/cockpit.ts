import type { CeeWorkflowStatus } from "@/features/cee-workflows/domain/constants";

/** Filtres cockpit (URL / formulaire). */
export type CockpitScopeFilters = {
  ceeSheetId: string | null;
  teamId: string | null;
  /** Canal acquisition (`leads.lead_channel`), utilisé comme proxy « centre / source » jusqu’à un vrai référentiel. */
  leadChannel: string | null;
  /** today | week | month | days30 */
  period: "today" | "week" | "month" | "days30";
};

export const DEFAULT_COCKPIT_FILTERS: CockpitScopeFilters = {
  ceeSheetId: null,
  teamId: null,
  leadChannel: null,
  period: "days30",
};

export type CockpitTrend = {
  current: number;
  previous: number;
  deltaPct: number | null;
};

export type CockpitAlertSeverity = "critical" | "warning" | "info";

/** `period` = performance / volumétrie sur la fenêtre cockpit ; `structural` = configuration réseau (hors temps). */
export type CockpitAlertScope = "period" | "structural";

export type CockpitAlertCategory =
  | "backlog"
  | "conversion"
  | "staffing"
  | "activity"
  | "loss"
  | "followup"
  | "quality"
  | "configuration"
  | "funnel"
  | "documentation";

export type CockpitAlertTargetType = "global" | "sheet" | "team" | "call_center" | "user";

/** Rôles / variantes cockpit pouvant recevoir l’alerte (`all` = pas de filtre audience). */
export type CockpitAlertAudienceRole =
  | "all"
  | "super_admin"
  | "admin"
  | "sales_director"
  | "manager"
  | "closer"
  | "confirmer"
  | "sales_agent";

export type CockpitPriorityQueueKey =
  | "staleDrafts"
  | "blockedConfirm"
  | "docsPreparedStale"
  | "agreementsAwaitingSign"
  | "oldAgreementSent";

export type CockpitAlertTopWorkflow = {
  workflowId: string;
  leadId: string;
  companyName: string;
  currentStatus: string;
  potentialValue: number | null;
  lastActionAt: string | null;
  daysSinceLastAction: number | null;
  priorityScore: number;
};

export type CockpitAlertCta = {
  label: string;
  href: string;
};

export type CockpitAlertPriorityLevel = "low" | "medium" | "high" | "urgent";

export type CockpitAlert = {
  id: string;
  scope: CockpitAlertScope;
  severity: CockpitAlertSeverity;
  category: CockpitAlertCategory;
  title: string;
  /** Texte principal (affiché). */
  message: string;
  /** @deprecated alias affiché = `message` pour rétrocompat. */
  description: string;
  suggestedAction: string;
  targetType: CockpitAlertTargetType;
  targetId: string | null;
  targetLabel: string | null;
  metricValue: number | null;
  thresholdValue: number | null;
  comparisonValue: number | null;
  /** Libellé période cockpit (ex. « 30 derniers jours ») — vide pour structurel. */
  period: string | null;
  roleAudience: CockpitAlertAudienceRole[];
  priorityScore: number;
  sortScore: number;
  /** @deprecated préférer `cta.href`. */
  href?: string;
  count?: number;
  /** Lien vers une file prioritaire du snapshot si applicable. */
  relatedQueueKey?: CockpitPriorityQueueKey;
  /** Dossiers prioritaires (serveur, tri métier). */
  topWorkflows: CockpitAlertTopWorkflow[];
  /** Estimation d’enjeu € (somme / défauts par étape si valeur absente). */
  estimatedImpactEuro: number | null;
  /** Nombre de workflows couverts par l’alerte (peut dépasser `topWorkflows.length`). */
  workflowsCount: number;
  /** Niveau de priorité d’exécution (couleur / tri UX). */
  priorityLevel: CockpitAlertPriorityLevel;
  cta: CockpitAlertCta;
};

export type CockpitAlertInput = Omit<
  CockpitAlert,
  | "description"
  | "priorityScore"
  | "sortScore"
  | "topWorkflows"
  | "estimatedImpactEuro"
  | "workflowsCount"
  | "priorityLevel"
  | "cta"
> & {
  topWorkflows?: CockpitAlertTopWorkflow[];
  estimatedImpactEuro?: number | null;
  workflowsCount?: number;
  priorityLevel?: CockpitAlertPriorityLevel;
  cta?: CockpitAlertCta;
};

export type CockpitFunnelCounts = Record<CeeWorkflowStatus, number> & {
  total: number;
};

export type CockpitQueueItem = {
  workflowId: string;
  leadId: string;
  companyName: string;
  status: CeeWorkflowStatus;
  sheetLabel: string;
  teamId: string | null;
  updatedAt: string;
  agreementSentAt: string | null;
};

export type CockpitSheetRollup = {
  sheetId: string;
  sheetCode: string;
  sheetLabel: string;
  workflowCount: number;
  byStatus: Partial<Record<CeeWorkflowStatus, number>>;
  signed: number;
  lost: number;
  sent: number;
};

export type CockpitTeamRollup = {
  teamId: string;
  teamName: string;
  sheetId: string;
  workflowCount: number;
  byStatus: Partial<Record<CeeWorkflowStatus, number>>;
};

export type CockpitChannelRollup = {
  channel: string;
  workflowCount: number;
  qualifiedPlus: number;
  signed: number;
};

export type CockpitWorkflowSnapshot = {
  funnel: CockpitFunnelCounts;
  bySheet: CockpitSheetRollup[];
  byTeam: CockpitTeamRollup[];
  byChannel: CockpitChannelRollup[];
  /** Files prioritaires (extraits, triées). */
  priorityQueues: {
    staleDrafts: CockpitQueueItem[];
    blockedConfirm: CockpitQueueItem[];
    docsPreparedStale: CockpitQueueItem[];
    agreementsAwaitingSign: CockpitQueueItem[];
    oldAgreementSent: CockpitQueueItem[];
  };
};

export type CockpitFilterOption = { id: string; label: string };

export type CockpitFilterOptions = {
  sheets: CockpitFilterOption[];
  teams: CockpitFilterOption[];
  channels: string[];
};
