import { getLinkedInEnrichmentActorId, getYellowPagesActorId } from "../apify/client";
import { resolveGoogleMapsLocationQuery } from "../apify/google-maps-actor-input";
import type { RunYellowPagesApifyImportInput } from "../apify/types";
import { yellowPagesUsActorFranceMismatchMessage } from "../apify/yellow-pages-us-france-guard";
import { countLeadGenerationStockNeedingContactImprovementForBatch } from "../queries/get-lead-generation-stock-ids-needing-contact-improvement-for-batch";
import { getLeadGenerationAssignableAgents } from "../queries/get-lead-generation-assignable-agents";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";
import {
  autoDispatchLeadGenerationStockRoundRobin,
  countDispatchableReadyNowPoolForBatch,
} from "./auto-dispatch-lead-generation-stock-round-robin";
import {
  executeUnifiedLinkedInPhase,
  executeUnifiedMapsPhase,
  executeUnifiedYellowPagesPhase,
} from "./unified-pipeline-ingest-phases";
import { insertUnifiedPipelineRun, updateUnifiedPipelineRun } from "./unified-pipeline-run-repository";
import type { UnifiedPipelineCurrentStep, UnifiedPipelineRunStatus, UnifiedPipelineStepsJson } from "./unified-pipeline-state";
import { createInitialStepsJson, mergeStepRecord, type UnifiedPipelineStepKey } from "./unified-pipeline-state";
import { prepareLeadGenerationLot } from "./prepare-lead-generation-lot";

export type UnifiedLeadGenerationPipelineInput = RunYellowPagesApifyImportInput;

export type UnifiedLeadGenerationPipelineResult = {
  ok: true;
  coordinatorBatchId: string;
  pipelineRunId: string;
  pipelineStatus: UnifiedPipelineRunStatus;
  currentStep: UnifiedPipelineCurrentStep;
  steps: UnifiedPipelineStepsJson;
  counts: {
    generatedAccepted: number;
    yellowPatched: number;
    linkedInUpdated: number;
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

  const yellowActorId = getYellowPagesActorId();
  if (!yellowActorId) {
    return {
      ok: false,
      error:
        "Parcours unifié : définissez APIFY_YELLOW_PAGES_ACTOR_ID — l’étape Pages Jaunes est obligatoire dans ce parcours.",
    };
  }
  const resolvedLocation = resolveGoogleMapsLocationQuery(input);
  const usFrMismatch = yellowPagesUsActorFranceMismatchMessage(yellowActorId, resolvedLocation);
  if (usFrMismatch) {
    return { ok: false, error: usFrMismatch };
  }
  if (!getLinkedInEnrichmentActorId()) {
    return {
      ok: false,
      error:
        "Parcours unifié : définissez APIFY_LINKEDIN_ENRICHMENT_ACTOR_ID — l’étape LinkedIn est obligatoire dans ce parcours.",
    };
  }

  let pipelineRunId: string | null = null;
  let coordinatorBatchId = "";
  let stepsJson: UnifiedPipelineStepsJson = createInitialStepsJson();
  const warnings: string[] = [];
  const onWarning = (w: string) => {
    warnings.push(w);
  };

  const counts = {
    generatedAccepted: 0,
    yellowPatched: 0,
    linkedInUpdated: 0,
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

  const failRun = async (
    status: UnifiedPipelineRunStatus,
    step: UnifiedPipelineStepKey,
    message: string,
    blocked: boolean,
  ) => {
    stepsJson = mergeStepRecord(stepsJson, step, {
      status: blocked ? "blocked" : "failed",
      message,
      finished_at: nowIso(),
    });
    if (pipelineRunId) {
      await updateUnifiedPipelineRun(pipelineRunId, {
        pipeline_status: status,
        current_step: step,
        steps_json: stepsJson,
        warnings: [...warnings],
        finished_at: nowIso(),
        summary_json: { error: message, counts },
      });
    }
    return {
      ok: false as const,
      error: message,
      blocked,
      blockedStep: blocked ? step : undefined,
      pipelineRunId: pipelineRunId ?? undefined,
      steps: stepsJson,
      warnings: [...warnings],
    };
  };

  try {
    // —— 1. Maps ——
    stepsJson = mergeStepRecord(stepsJson, "maps", { status: "running", started_at: nowIso() });

    const mapsOutcome = await executeUnifiedMapsPhase(input, { deferYellowPages: true });
    coordinatorBatchId = mapsOutcome.coordinatorBatchId;
    counts.generatedAccepted = mapsOutcome.acceptedCount;

    pipelineRunId = await insertUnifiedPipelineRun(coordinatorBatchId);

    stepsJson = mergeStepRecord(stepsJson, "maps", {
      status: "completed",
      count: counts.generatedAccepted,
      finished_at: nowIso(),
    });
    await persist({ steps_json: stepsJson, current_step: "yellow_pages" });

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
        stopReason: "Aucune fiche utile n’a été ajoutée au lot — le parcours s’arrête après Maps.",
        status: "stopped",
      };
    }

    // —— 2. Yellow Pages ——
    stepsJson = mergeStepRecord(stepsJson, "yellow_pages", { status: "running", started_at: nowIso() });
    await persist({ steps_json: stepsJson, current_step: "yellow_pages" });

    const yp = await executeUnifiedYellowPagesPhase(input, coordinatorBatchId, {
      strict: true,
      onWarning,
    });
    if (!("patchedCount" in yp)) {
      return await failRun("blocked", "yellow_pages", yp.message, true);
    }
    counts.yellowPatched = yp.patchedCount;
    stepsJson = mergeStepRecord(stepsJson, "yellow_pages", {
      status: "completed",
      count: yp.patchedCount,
      message: yp.fetchedCount ? `${yp.fetchedCount} ligne(s) dataset` : undefined,
      finished_at: nowIso(),
    });
    await persist({ steps_json: stepsJson, current_step: "linkedin" });

    // —— 3. LinkedIn ——
    stepsJson = mergeStepRecord(stepsJson, "linkedin", { status: "running", started_at: nowIso() });
    await persist({ steps_json: stepsJson, current_step: "linkedin" });

    const li = await executeUnifiedLinkedInPhase(coordinatorBatchId, { strict: true, onWarning });
    if (!("updatedCount" in li)) {
      return await failRun("blocked", "linkedin", li.message, true);
    }
    counts.linkedInUpdated = li.updatedCount;
    stepsJson = mergeStepRecord(stepsJson, "linkedin", {
      status: "completed",
      count: li.updatedCount,
      finished_at: nowIso(),
    });
    await persist({ steps_json: stepsJson, current_step: "improve" });

    // —— 4. Améliorer ——
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
          "Après amélioration, aucune fiche du lot n’est prête à être confiée — complétez les contacts ou affinez la campagne.",
        status: "stopped",
      };
    }

    // —— 5. Distribuer ——
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
          ? "Aucune fiche du lot n’a pu être attribuée (vérifiez les agents éligibles et les plafonds par commercial)."
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
