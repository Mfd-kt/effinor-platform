import type { RunGoogleMapsApifyImportInput } from "../apify/types";
import { countLeadGenerationStockNeedingContactImprovementForBatch } from "../queries/get-lead-generation-stock-ids-needing-contact-improvement-for-batch";
import { getLeadGenerationAssignableAgents } from "../queries/get-lead-generation-assignable-agents";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";
import {
  autoDispatchLeadGenerationStockRoundRobin,
  countDispatchableReadyNowPoolForBatch,
} from "./auto-dispatch-lead-generation-stock-round-robin";
import { executeUnifiedFirecrawlPhase, executeUnifiedMapsPhase } from "./unified-pipeline-ingest-phases";
import { insertUnifiedPipelineRun, updateUnifiedPipelineRun } from "./unified-pipeline-run-repository";
import type {
  UnifiedPipelineCurrentStep,
  UnifiedPipelineRunStatus,
  UnifiedPipelineStepKey,
  UnifiedPipelineStepsJson,
} from "./unified-pipeline-state";
import { createInitialStepsJson, mergeStepRecord } from "./unified-pipeline-state";
import { prepareLeadGenerationLot } from "./prepare-lead-generation-lot";

export type UnifiedLeadGenerationPipelineInput = RunGoogleMapsApifyImportInput;

export type UnifiedLeadGenerationPipelineResult = {
  ok: true;
  coordinatorBatchId: string;
  pipelineRunId: string;
  pipelineStatus: UnifiedPipelineRunStatus;
  currentStep: UnifiedPipelineCurrentStep;
  steps: UnifiedPipelineStepsJson;
  counts: {
    generatedAccepted: number;
    firecrawlSucceeded: number;
    improved: number;
    readyInLot: number;
    distributed: number;
    remainingToComplete: number;
  };
  warnings: string[];
  stopReason: string | null;
  status: "completed" | "stopped";
};

export type UnifiedLeadGenerationPipelineOutcome =
  | UnifiedLeadGenerationPipelineResult
  | {
      ok: false;
      error: string;
      blocked?: boolean;
      blockedStep?: UnifiedPipelineStepKey;
      pipelineRunId?: string;
      steps?: UnifiedPipelineStepsJson;
      warnings?: string[];
    };

function nowIso(): string {
  return new Date().toISOString();
}

export async function runUnifiedLeadGenerationPipeline(
  input: UnifiedLeadGenerationPipelineInput,
  existingPipelineRunId?: string | null,
): Promise<UnifiedLeadGenerationPipelineOutcome> {
  if (existingPipelineRunId) {
    return {
      ok: false,
      error: "Reprise de run pipeline (existingPipelineRunId) non supportée pour l’instant.",
    };
  }

  let pipelineRunId: string | null = null;
  let coordinatorBatchId = "";
  let stepsJson: UnifiedPipelineStepsJson = createInitialStepsJson();
  const warnings: string[] = [];

  const counts = {
    generatedAccepted: 0,
    firecrawlSucceeded: 0,
    improved: 0,
    readyInLot: 0,
    distributed: 0,
    remainingToComplete: 0,
  };

  const persist = async (patch: {
    pipeline_status?: UnifiedPipelineRunStatus;
    current_step?: UnifiedPipelineCurrentStep;
    steps_json?: UnifiedPipelineStepsJson;
    finished_at?: string | null;
    summary_json?: Record<string, unknown>;
  }) => {
    if (!pipelineRunId) return;
    await updateUnifiedPipelineRun(pipelineRunId, {
      ...patch,
      warnings: [...warnings],
      step_payload: { counts, lastUpdate: nowIso() },
    });
  };

  try {
    // —— 1. Maps ——
    stepsJson = mergeStepRecord(stepsJson, "maps", { status: "running", started_at: nowIso() });

    const mapsOutcome = await executeUnifiedMapsPhase(input);
    coordinatorBatchId = mapsOutcome.coordinatorBatchId;
    counts.generatedAccepted = mapsOutcome.acceptedCount;

    pipelineRunId = await insertUnifiedPipelineRun(coordinatorBatchId);

    stepsJson = mergeStepRecord(stepsJson, "maps", {
      status: "completed",
      count: counts.generatedAccepted,
      finished_at: nowIso(),
    });
    await persist({ steps_json: stepsJson, current_step: "firecrawl" });

    if (counts.generatedAccepted === 0) {
      counts.remainingToComplete = await countLeadGenerationStockNeedingContactImprovementForBatch(
        coordinatorBatchId,
      );
      await persist({
        pipeline_status: "stopped",
        current_step: "done",
        steps_json: stepsJson,
        finished_at: nowIso(),
        summary_json: { counts, stop: "no_leads" },
      });
      return {
        ok: true,
        coordinatorBatchId,
        pipelineRunId,
        pipelineStatus: "stopped",
        currentStep: "done",
        steps: stepsJson,
        counts,
        warnings,
        stopReason: "Aucun contact n’a été généré par cette campagne.",
        status: "stopped",
      };
    }

    // —— 2. Firecrawl (sites publics) ——
    stepsJson = mergeStepRecord(stepsJson, "firecrawl", { status: "running", started_at: nowIso() });
    await persist({ steps_json: stepsJson, current_step: "firecrawl" });

    const firecrawlOutcome = await executeUnifiedFirecrawlPhase(coordinatorBatchId);
    counts.firecrawlSucceeded = firecrawlOutcome.succeeded;

    stepsJson = mergeStepRecord(stepsJson, "firecrawl", {
      status: "completed",
      count: firecrawlOutcome.succeeded,
      finished_at: nowIso(),
      ...(firecrawlOutcome.nothingToEnrich
        ? {
            message:
              "Aucune fiche de ce lot ne nécessitait une lecture de site : le lot est passé directement à l’étape suivante.",
          }
        : {}),
    });
    await persist({ steps_json: stepsJson, current_step: "improve" });

    // —— 3. Améliorer (qualification / scoring / compléments restants) ——
    stepsJson = mergeStepRecord(stepsJson, "improve", { status: "running", started_at: nowIso() });
    await persist({ steps_json: stepsJson, current_step: "improve" });

    const prepared = await prepareLeadGenerationLot(coordinatorBatchId);
    counts.improved = prepared.improvement_succeeded;
    counts.readyInLot = await countDispatchableReadyNowPoolForBatch(coordinatorBatchId);

    stepsJson = mergeStepRecord(stepsJson, "improve", {
      status: "completed",
      count: counts.improved,
      finished_at: nowIso(),
    });
    await persist({ steps_json: stepsJson, current_step: "dispatch" });

    if (counts.readyInLot === 0) {
      counts.remainingToComplete = await countLeadGenerationStockNeedingContactImprovementForBatch(
        coordinatorBatchId,
      );
      await persist({
        pipeline_status: "stopped",
        current_step: "done",
        steps_json: stepsJson,
        finished_at: nowIso(),
        summary_json: { counts, stop: "none_ready" },
      });
      return {
        ok: true,
        coordinatorBatchId,
        pipelineRunId,
        pipelineStatus: "stopped",
        currentStep: "done",
        steps: stepsJson,
        counts,
        warnings,
        stopReason:
          "Les fiches ont été améliorées, mais aucune n’est encore prête à distribuer.",
        status: "stopped",
      };
    }

    // —— 4. Distribuer ——
    stepsJson = mergeStepRecord(stepsJson, "dispatch", { status: "running", started_at: nowIso() });
    await persist({ steps_json: stepsJson, current_step: "dispatch" });

    const agents = await getLeadGenerationAssignableAgents();
    const { settings } = await getLeadGenerationSettings();
    let dispatched = 0;
    if (agents.length > 0) {
      const disp = await autoDispatchLeadGenerationStockRoundRobin({
        agents,
        maxActiveStockPerAgent: settings.mainActionsDefaults.agent_stock_cap,
        importBatchId: coordinatorBatchId,
      });
      dispatched = disp.total_assigned;
    }
    counts.distributed = dispatched;
    counts.remainingToComplete = await countLeadGenerationStockNeedingContactImprovementForBatch(coordinatorBatchId);

    const finalPipelineStatus: UnifiedPipelineRunStatus = dispatched === 0 ? "stopped" : "completed";
    stepsJson = mergeStepRecord(stepsJson, "dispatch", {
      status: "completed",
      count: dispatched,
      finished_at: nowIso(),
    });

    await persist({
      pipeline_status: finalPipelineStatus,
      current_step: "done",
      steps_json: stepsJson,
      finished_at: nowIso(),
      summary_json: { counts, done: finalPipelineStatus === "completed" },
    });

    return {
      ok: true,
      coordinatorBatchId,
      pipelineRunId,
      pipelineStatus: finalPipelineStatus,
      currentStep: "done",
      steps: stepsJson,
      counts,
      warnings,
      stopReason:
        dispatched === 0
          ? "Aucun lead prêt n’a pu être attribué (vérifiez les commerciaux éligibles et les plafonds)."
          : null,
      status: finalPipelineStatus === "completed" ? "completed" : "stopped",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Parcours interrompu.";
    if (pipelineRunId && coordinatorBatchId) {
      try {
        await updateUnifiedPipelineRun(pipelineRunId, {
          pipeline_status: "failed",
          warnings: [...warnings, msg],
          finished_at: nowIso(),
          summary_json: { error: msg, counts },
        });
      } catch {
        /* ignore */
      }
    }
    return { ok: false, error: msg };
  }
}
