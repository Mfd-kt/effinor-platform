/** Clés d’étapes du parcours unifié (ordre strict). */
export const UNIFIED_PIPELINE_STEPS = [
  "maps",
  "yellow_pages",
  "linkedin",
  "improve",
  "dispatch",
] as const;

export type UnifiedPipelineStepKey = (typeof UNIFIED_PIPELINE_STEPS)[number];

export type UnifiedPipelineRunStatus = "running" | "completed" | "failed" | "blocked" | "stopped";

export type UnifiedPipelineCurrentStep =
  | UnifiedPipelineStepKey
  | "done";

export type UnifiedPipelineStepRecord = {
  status: "pending" | "running" | "completed" | "failed" | "blocked";
  count?: number;
  message?: string;
  started_at?: string;
  finished_at?: string;
};

export type UnifiedPipelineStepsJson = Record<string, UnifiedPipelineStepRecord>;

export function createInitialStepsJson(): UnifiedPipelineStepsJson {
  const out: UnifiedPipelineStepsJson = {};
  for (const k of UNIFIED_PIPELINE_STEPS) {
    out[k] = { status: "pending" };
  }
  return out;
}

export function mergeStepRecord(
  steps: UnifiedPipelineStepsJson,
  key: UnifiedPipelineStepKey,
  patch: Partial<UnifiedPipelineStepRecord>,
): UnifiedPipelineStepsJson {
  const prev = steps[key] ?? { status: "pending" as const };
  return {
    ...steps,
    [key]: { ...prev, ...patch },
  };
}
