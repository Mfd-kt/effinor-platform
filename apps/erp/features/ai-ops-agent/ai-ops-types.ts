import type { Json } from "@/types/database.types";

export type AiOpsRoleTarget =
  | "agent"
  | "confirmateur"
  | "closer"
  | "manager"
  | "direction"
  | "commercial";

/** Statuts persistés côté base (migration discipline). */
export type AiOpsConversationStatus =
  | "open"
  | "awaiting_user"
  | "snoozed"
  | "resolved"
  | "escalated"
  | "auto_closed";

export type AiOpsMessageType =
  | "alert"
  | "question"
  | "reply"
  | "recommendation"
  | "escalation"
  | "resolution";

export type AiOpsSenderType = "ai" | "user" | "manager" | "system";

export type AiOpsPriority = "low" | "normal" | "high" | "critical";

export type AiOpsSeverity = "info" | "warning" | "high" | "critical";

/** Clé métier du détecteur (et préfixe batch:… après regroupement). */
export type AiOpsIssueType =
  | "overdue_callback"
  | "badly_handled_lead"
  | "stalled_workflow"
  | "missing_fields"
  | "team_unassigned"
  | "sla_breach"
  | "batch_overdue_callback"
  | "batch_badly_handled_lead"
  | "batch_stalled_workflow"
  | "batch_missing_fields"
  | "batch_team_unassigned";

export type AiOpsRelatedEntityRef = { type: string; id: string };

/** Issue détectée → matérialisée en conversation + message agent. */
export type AiOpsDetectedIssue = {
  targetUserId: string;
  roleTarget: AiOpsRoleTarget;
  /** Défini par buildAiOpsDedupeKey si absent. */
  dedupeKey?: string;
  issueType: AiOpsIssueType;
  topic: string;
  priority: AiOpsPriority;
  severity?: AiOpsSeverity;
  messageType: AiOpsMessageType;
  body: string;
  requiresAction: boolean;
  actionType?: string | null;
  actionPayload?: Json | null;
  entityType?: string | null;
  entityId?: string | null;
  metadataJson?: Json;
  /** Valeur estimée (callback / lead) pour priorisation. */
  estimatedValueEur?: number;
  /** Entités regroupées (batch). */
  relatedEntities?: AiOpsRelatedEntityRef[];
};

export type RunAiOpsAgentResult = {
  skipped: boolean;
  skipReason?: string;
  issuesDetected: number;
  issuesAfterGrouping: number;
  conversationsOpened: number;
  conversationsTouched: number;
  messagesSent: number;
  dedupeSkipped: number;
  cooldownSkipped: number;
  autoResolved: number;
  autoClosed: number;
  unsnoozed: number;
  messagesSuppressed: number;
  openCapSkipped: number;
  dailyCapSkipped: number;
  durationMs: number;
};

export type AiOpsConversationContext = {
  userId: string;
  roleTarget: AiOpsRoleTarget;
  conversationId: string;
  status: AiOpsConversationStatus;
  topic: string;
  priority: string;
  severity: string;
  recentMessages: Array<{
    senderType: AiOpsSenderType;
    body: string;
    messageType: AiOpsMessageType;
    createdAt: string;
  }>;
  entityType: string | null;
  entityId: string | null;
  metadataJson?: Json;
};
