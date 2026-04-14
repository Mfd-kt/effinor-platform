import type { AccessContext } from "@/lib/auth/access-context";
import { createAdminClient } from "@/lib/supabase/admin";

import { finalizeAiActionLog, insertPendingAiActionLog } from "../ai-actions/ai-action-logger";
import { runAiActionHandler } from "../ai-actions/ai-action-handlers";
import { isOrchestratorAutoActionAllowed } from "./ai-safety-rules";
import { AI_ORCHESTRATOR_TRIGGER_SOURCE, getAiOrchestratorActorUserId } from "./orchestrator-env";
import type { AiOrchestratorDecision } from "./types";

type Admin = ReturnType<typeof createAdminClient>;

const guestAccess: AccessContext = { kind: "guest" };

async function hasRecentSuccessfulOrchestratorAction(
  admin: Admin,
  recommendationId: string,
  dedupeHours: number,
): Promise<boolean> {
  const since = new Date(Date.now() - dedupeHours * 3_600_000).toISOString();
  const { data, error } = await admin
    .from("ai_action_logs")
    .select("id")
    .eq("recommendation_id", recommendationId)
    .eq("executed_by", "ai")
    .eq("trigger_source", AI_ORCHESTRATOR_TRIGGER_SOURCE)
    .eq("status", "success")
    .gte("created_at", since)
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

function dedupeHoursForDecision(d: AiOrchestratorDecision): number {
  if (d.actionType === "reschedule_callback") return 8;
  if (d.actionType === "assign_workflow") return 6;
  return 3;
}

export type ExecuteAiActionsResult = {
  executed: number;
  failed: number;
  skipped: number;
  errors: string[];
};

/**
 * Exécute les décisions auto autorisées, journalisées avec `executed_by = ai`.
 */
export async function executeAiActions(
  decisions: AiOrchestratorDecision[],
  options?: { maxActions?: number },
): Promise<ExecuteAiActionsResult> {
  const actorUserId = getAiOrchestratorActorUserId();
  if (!actorUserId) {
    return { executed: 0, failed: 0, skipped: decisions.length, errors: ["AI_ORCHESTRATOR_ACTOR_USER_ID manquant."] };
  }

  const admin = createAdminClient();
  const max = options?.maxActions ?? 15;
  let executed = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const d of decisions) {
    if (executed + failed >= max) {
      skipped += 1;
      continue;
    }
    if (!d.autoExecutable || !isOrchestratorAutoActionAllowed(d.actionType)) {
      skipped += 1;
      continue;
    }

    if (await hasRecentSuccessfulOrchestratorAction(admin, d.recommendationId, dedupeHoursForDecision(d))) {
      skipped += 1;
      continue;
    }

    const pending = await insertPendingAiActionLog(admin, {
      recommendationId: d.recommendationId,
      actionType: d.actionType,
      payloadJson: d.payload,
      actorUserId,
      executedBy: "ai",
      triggerSource: AI_ORCHESTRATOR_TRIGGER_SOURCE,
      reason: d.reason,
    });
    if (!pending.ok) {
      failed += 1;
      errors.push(pending.error);
      continue;
    }

    try {
      const result = await runAiActionHandler(
        { supabase: admin, access: guestAccess, actorUserId, orchestratorMode: true },
        d.actionType,
        d.payload,
      );
      if (!result.ok) {
        failed += 1;
        errors.push(result.error);
        await finalizeAiActionLog(admin, {
          logId: pending.id,
          status: "failed",
          resultJson: null,
          errorMessage: result.error,
        });
        continue;
      }
      await finalizeAiActionLog(admin, {
        logId: pending.id,
        status: "success",
        resultJson: result.resultJson ?? null,
        errorMessage: null,
      });
      executed += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      failed += 1;
      errors.push(msg);
      await finalizeAiActionLog(admin, {
        logId: pending.id,
        status: "failed",
        resultJson: null,
        errorMessage: msg,
      });
    }
  }

  return { executed, failed, skipped, errors };
}
