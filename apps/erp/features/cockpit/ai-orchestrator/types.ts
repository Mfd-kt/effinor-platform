import type { CockpitAiActionType } from "@/features/cockpit/types";
import type { Json } from "@/types/database.types";

export type OrchestratorCallbackSnapshot = {
  id: string;
  companyName: string;
  status: string;
  attemptsCount: number;
  assignedAgentUserId: string | null;
  dueToday: boolean;
  overdue: boolean;
};

export type OrchestratorAutoAssignHint = {
  workflowId: string;
  agentUserId: string;
  teamId: string;
} | null;

export type BusinessStateAnalysis = {
  /** Rappels éligibles aux actions auto (today / overdue, non terminaux). */
  cashCallbacks: OrchestratorCallbackSnapshot[];
  autoAssign: OrchestratorAutoAssignHint;
  leadsCreatedToday: number;
  /** Rappels en retard (estimation volume). */
  overdueCallbacksCount: number;
};

export type AiOrchestratorDecision = {
  recommendationId: string;
  actionType: CockpitAiActionType;
  payload: Json;
  priority: number;
  autoExecutable: boolean;
  reason: string;
};

export type RunAiOrchestratorResult = {
  skipped: boolean;
  skipReason?: string;
  decisionsCount: number;
  executed: number;
  failed: number;
  keptAsRecommendation: number;
  errors: string[];
  durationMs: number;
};
