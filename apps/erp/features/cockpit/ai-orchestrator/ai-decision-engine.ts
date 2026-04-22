import type { Json } from "@/types/database.types";

import { getAiOrchestrationNotifyUserIds } from "./orchestrator-env";
import type { AiOrchestratorDecision, BusinessStateAnalysis } from "./types";

const BACKLOG_NOTIFY_THRESHOLD = 12;

function notifyPayload(title: string, body: string, targetUserId: string): Json {
  return {
    title: title.slice(0, 200),
    body: body.slice(0, 2000),
    target_user_id: targetUserId,
  };
}

/**
 * Décide des actions — ordre de priorité : cash → pipeline → anomalies humaines → configuration (hors scope auto V1).
 */
export function decideAiActions(state: BusinessStateAnalysis): AiOrchestratorDecision[] {
  const out: AiOrchestratorDecision[] = [];
  const directionIds = getAiOrchestrationNotifyUserIds();

  for (const cb of state.cashCallbacks) {
    if (cb.attemptsCount < 1) continue;

    if (cb.attemptsCount >= 2 && (cb.overdue || cb.dueToday)) {
      out.push({
        recommendationId: `orch:reschedule-callback:${cb.id}`,
        actionType: "reschedule_callback",
        payload: { callback_id: cb.id, preset: "plus_30m" },
        priority: 100,
        autoExecutable: true,
        reason: `Rappel ${cb.overdue ? "en retard" : "du jour"} · ${cb.attemptsCount} tentative(s) — report auto +30 min pour libérer la file.`,
      });
      continue;
    }

    const target =
      cb.assignedAgentUserId ?? (directionIds[0] ?? null);
    if (!target) continue;

    out.push({
      recommendationId: `orch:notify-callback:${cb.id}`,
      actionType: "notify_user",
      payload: notifyPayload(
        `Rappel prioritaire — ${cb.companyName}`,
        `${cb.overdue ? "En retard" : "Aujourd’hui"} · rappel commercial à traiter tout de suite (tentative(s) : ${cb.attemptsCount}).`,
        target,
      ),
      priority: 110,
      autoExecutable: true,
      reason: "Callback today/overdue avec au moins une tentative — notification agent ou direction.",
    });
  }

  if (state.autoAssign) {
    out.push({
      recommendationId: `orch:auto-assign:${state.autoAssign.workflowId}`,
      actionType: "assign_workflow",
      payload: {
        workflow_id: state.autoAssign.workflowId,
        assignee_user_id: state.autoAssign.agentUserId,
        role: "agent",
      },
      priority: 80,
      autoExecutable: true,
      reason: "Dossier sans agent sur une équipe active — affectation automatique du premier agent disponible.",
    });
  }

  out.sort((a, b) => b.priority - a.priority);
  return out;
}

export function detectOpportunities(state: BusinessStateAnalysis): BusinessStateAnalysis {
  return state;
}
