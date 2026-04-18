import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

import { runEvaluateDispatchQueueRecentStockJob } from "./evaluate-dispatch-queue-recent-stock";
import { runEvaluateRecyclingActiveAssignmentsJob } from "./evaluate-recycling-active-assignments";
import { runScoreRecentStockJob } from "./score-recent-stock";
import { runSyncPendingImportsJob } from "./sync-pending-imports";
import type { LeadGenerationAutomationType } from "./types";

export type RunLeadGenerationAutomationResult = {
  id: string;
  automationType: LeadGenerationAutomationType;
  status: "completed" | "failed";
  summary: Record<string, unknown>;
  errorSummary: string | null;
  startedAt: string;
  finishedAt: string | null;
};

async function executeJob(type: LeadGenerationAutomationType): Promise<Record<string, unknown>> {
  switch (type) {
    case "sync_pending_imports":
      return (await runSyncPendingImportsJob()) as unknown as Record<string, unknown>;
    case "score_recent_stock":
      return (await runScoreRecentStockJob()) as unknown as Record<string, unknown>;
    case "evaluate_dispatch_queue_recent_stock":
      return (await runEvaluateDispatchQueueRecentStockJob()) as unknown as Record<string, unknown>;
    case "evaluate_recycling_active_assignments":
      return (await runEvaluateRecyclingActiveAssignmentsJob()) as unknown as Record<string, unknown>;
  }
}

/**
 * Crée une ligne de journal, exécute un job borné, met à jour le statut et le résumé.
 */
export async function runLeadGenerationAutomation(input: {
  automationType: LeadGenerationAutomationType;
  triggeredByUserId: string | null;
}): Promise<RunLeadGenerationAutomationResult> {
  const supabase = await createClient();
  const table = lgTable(supabase, "lead_generation_automation_runs");

  const { data: row, error: insertErr } = await table
    .insert({
      automation_type: input.automationType,
      status: "running",
      triggered_by_user_id: input.triggeredByUserId,
      summary: {},
    } as never)
    .select("id, started_at")
    .single();

  if (insertErr || !row) {
    throw new Error(insertErr?.message ?? "Impossible de créer l’entrée de journal d’automatisation.");
  }

  const { id: runId, started_at: startedAt } = row as { id: string; started_at: string };

  try {
    const summary = await executeJob(input.automationType);
    const finishedAt = new Date().toISOString();
    const { error: upErr } = await table
      .update({
        status: "completed",
        finished_at: finishedAt,
        summary: summary as never,
        error_summary: null,
      } as never)
      .eq("id", runId);

    if (upErr) {
      throw new Error(upErr.message);
    }

    return {
      id: runId,
      automationType: input.automationType,
      status: "completed",
      summary,
      errorSummary: null,
      startedAt,
      finishedAt,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const finishedAt = new Date().toISOString();
    const safeMessage = message.slice(0, 5000);

    await table
      .update({
        status: "failed",
        finished_at: finishedAt,
        error_summary: safeMessage,
        summary: { error: safeMessage } as never,
      } as never)
      .eq("id", runId);

    return {
      id: runId,
      automationType: input.automationType,
      status: "failed",
      summary: { error: safeMessage },
      errorSummary: safeMessage,
      startedAt,
      finishedAt,
    };
  }
}
