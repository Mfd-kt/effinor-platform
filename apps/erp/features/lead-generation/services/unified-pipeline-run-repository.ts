import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import { lgTable } from "../lib/lg-db";
import type {
  UnifiedPipelineCurrentStep,
  UnifiedPipelineRunStatus,
  UnifiedPipelineStepsJson,
} from "./unified-pipeline-state";
import { createInitialStepsJson } from "./unified-pipeline-state";

export type PipelineRunRowPatch = {
  pipeline_status?: UnifiedPipelineRunStatus;
  current_step?: UnifiedPipelineCurrentStep;
  steps_json?: UnifiedPipelineStepsJson;
  warnings?: string[];
  summary_json?: Record<string, unknown>;
  step_payload?: Record<string, unknown>;
  finished_at?: string | null;
};

export async function insertUnifiedPipelineRun(coordinatorBatchId: string): Promise<string> {
  const supabase = await createClient();
  const runs = lgTable(supabase, "lead_generation_pipeline_runs");
  const now = new Date().toISOString();
  const steps_json = createInitialStepsJson();
  const { data, error } = await runs
    .insert({
      coordinator_batch_id: coordinatorBatchId,
      pipeline_status: "running",
      current_step: "maps",
      steps_json: steps_json as unknown as Json,
      warnings: [] as unknown as Json,
      summary_json: {} as unknown as Json,
      step_payload: {} as unknown as Json,
      updated_at: now,
    } as never)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Création suivi pipeline impossible.");
  }
  return (data as { id: string }).id;
}

export async function updateUnifiedPipelineRun(runId: string, patch: PipelineRunRowPatch): Promise<void> {
  const supabase = await createClient();
  const runs = lgTable(supabase, "lead_generation_pipeline_runs");
  const now = new Date().toISOString();
  const body: Record<string, unknown> = { updated_at: now };
  if (patch.pipeline_status !== undefined) body.pipeline_status = patch.pipeline_status;
  if (patch.current_step !== undefined) body.current_step = patch.current_step;
  if (patch.steps_json !== undefined) body.steps_json = patch.steps_json;
  if (patch.warnings !== undefined) body.warnings = patch.warnings;
  if (patch.summary_json !== undefined) body.summary_json = patch.summary_json;
  if (patch.step_payload !== undefined) body.step_payload = patch.step_payload;
  if (patch.finished_at !== undefined) body.finished_at = patch.finished_at;

  const { error } = await runs.update(body as never).eq("id", runId);
  if (error) {
    throw new Error(error.message);
  }
}
