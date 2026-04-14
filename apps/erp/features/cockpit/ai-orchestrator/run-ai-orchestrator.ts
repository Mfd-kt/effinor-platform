import { insertAutomationLogSupabase } from "@/features/automation/services/automation-log-service";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

import { decideAiActions, detectOpportunities } from "./ai-decision-engine";
import { executeAiActions } from "./ai-execution-engine";
import { generateReport } from "./ai-reporting";
import { analyzeBusinessState, loadCockpitDataForOrchestrator } from "./load-orchestrator-state";
import {
  getAiOrchestrationNotifyUserIds,
  getAiOrchestratorActorUserId,
  isAiAutonomousModeEnabled,
} from "./orchestrator-env";
import type { AiOrchestratorDecision, RunAiOrchestratorResult } from "./types";

function notifyPayload(title: string, body: string, targetUserId: string): Json {
  return {
    title: title.slice(0, 200),
    body: body.slice(0, 2000),
    target_user_id: targetUserId,
  };
}

function automationFailureDecisions(): AiOrchestratorDecision[] {
  const day = new Date().toISOString().slice(0, 10);
  const hour = new Date().toISOString().slice(0, 13);
  const out: AiOrchestratorDecision[] = [];
  for (const uid of getAiOrchestrationNotifyUserIds()) {
    out.push({
      recommendationId: `orch:notify-cron-fail:${day}:${hour}:${uid}`,
      actionType: "notify_user",
      payload: notifyPayload(
        "Automation / cron — anomalie",
        "Le tick automation cockpit a signalé un échec ou un chargement d’alertes impossible. Vérifier les logs et le secret cron.",
        uid,
      ),
      priority: 200,
      autoExecutable: true,
      reason: "Sécurité ops — information direction (cron / alertes).",
    });
  }
  return out;
}

/**
 * Pipeline : chargement → analyse → décisions → exécution contrôlée → reporting direction.
 */
export async function runAiOrchestrator(input?: {
  automationTickSuccess?: boolean;
  automationLoadError?: string | null;
}): Promise<RunAiOrchestratorResult> {
  const t0 = Date.now();
  const empty = (): RunAiOrchestratorResult => ({
    skipped: true,
    decisionsCount: 0,
    executed: 0,
    failed: 0,
    keptAsRecommendation: 0,
    errors: [],
    durationMs: Date.now() - t0,
  });

  if (!isAiAutonomousModeEnabled()) {
    return { ...empty(), skipReason: "AI_AUTONOMOUS_MODE est désactivé (aucune exécution auto)." };
  }
  if (!getAiOrchestratorActorUserId()) {
    return {
      ...empty(),
      skipReason: "AI_ORCHESTRATOR_ACTOR_USER_ID manquant (profil audit requis).",
    };
  }

  const admin = createAdminClient();
  let state = await loadCockpitDataForOrchestrator(admin);
  state = analyzeBusinessState(state);
  state = detectOpportunities(state);

  let decisions = decideAiActions(state);
  const automationOk = input?.automationTickSuccess !== false && !input?.automationLoadError;
  if (!automationOk) {
    decisions = [...automationFailureDecisions(), ...decisions];
  }

  const execResult = await executeAiActions(decisions, { maxActions: 15 });
  await generateReport(execResult, state, automationOk);

  await insertAutomationLogSupabase(admin, {
    automationType: "ai_orchestrator_tick",
    status: execResult.failed > 0 ? "failed" : "success",
    resultJson: {
      executed: execResult.executed,
      failed: execResult.failed,
      skipped: execResult.skipped,
      decisions: decisions.length,
    },
    errorMessage: execResult.errors.length ? execResult.errors.slice(0, 3).join(" | ") : null,
  });

  return {
    skipped: false,
    decisionsCount: decisions.length,
    executed: execResult.executed,
    failed: execResult.failed,
    keptAsRecommendation: execResult.skipped,
    errors: execResult.errors,
    durationMs: Date.now() - t0,
  };
}
