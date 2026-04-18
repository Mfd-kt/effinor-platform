import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";
import { countLeadGenerationStockNeedingContactImprovementForBatch } from "./get-lead-generation-stock-ids-needing-contact-improvement-for-batch";

export type UnifiedPipelineLockState = {
  locked: boolean;
  blockingCount: number;
  coordinatorBatchId: string | null;
};

/**
 * Verrou parcours unifié : fiches « à compléter » sur le lot du **dernier run terminé avec succès** (`completed` ou `stopped`).
 * Si le dernier run est encore `running`, ou a échoué / est bloqué (`failed`, `blocked`), on ne verrouille pas : le lot n’est pas
 * considéré comme « clos » côté parcours (relance possible après correction Apify, etc.).
 */
export async function getUnifiedPipelineLockState(): Promise<UnifiedPipelineLockState> {
  const supabase = await createClient();
  const runs = lgTable(supabase, "lead_generation_pipeline_runs");

  const { data, error } = await runs
    .select("coordinator_batch_id, pipeline_status")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Verrou pipeline : ${error.message}`);
  }

  const row = data as { coordinator_batch_id: string; pipeline_status: string } | null;
  if (!row?.coordinator_batch_id) {
    return { locked: false, blockingCount: 0, coordinatorBatchId: null };
  }

  const terminalSuccess =
    row.pipeline_status === "completed" || row.pipeline_status === "stopped";

  if (!terminalSuccess) {
    return {
      locked: false,
      blockingCount: 0,
      coordinatorBatchId: row.coordinator_batch_id,
    };
  }

  const blockingCount = await countLeadGenerationStockNeedingContactImprovementForBatch(row.coordinator_batch_id);
  return {
    locked: blockingCount > 0,
    blockingCount,
    coordinatorBatchId: row.coordinator_batch_id,
  };
}
