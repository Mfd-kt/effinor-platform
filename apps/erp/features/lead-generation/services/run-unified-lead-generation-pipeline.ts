import type {
  UnifiedPipelineCurrentStep,
  UnifiedPipelineRunStatus,
  UnifiedPipelineStepKey,
  UnifiedPipelineStepsJson,
} from "./unified-pipeline-state";

// TODO: Reimplement when new lead-gen sources (Pages Jaunes / Le Bon Coin) replace Apify Google Maps + Firecrawl.
export type UnifiedLeadGenerationPipelineInput = Record<string, unknown>;

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

export async function runUnifiedLeadGenerationPipeline(
  _input: UnifiedLeadGenerationPipelineInput,
  _existingPipelineRunId?: string | null,
): Promise<UnifiedLeadGenerationPipelineOutcome> {
  return {
    ok: false,
    error:
      "Pipeline unifié indisponible : la phase Google Maps (Apify) a été retirée et la nouvelle source d'acquisition n'est pas encore branchée.",
  };
}
