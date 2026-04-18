import { getYellowPagesActorId } from "../apify/client";
import type { RunYellowPagesApifyImportInput } from "../apify/types";
import { countLeadGenerationStockNeedingContactImprovementForBatch } from "../queries/get-lead-generation-stock-ids-needing-contact-improvement-for-batch";
import {
  executeUnifiedLinkedInPhase,
  executeUnifiedMapsPhase,
  executeUnifiedYellowPagesPhase,
} from "./unified-pipeline-ingest-phases";

export type UnifiedLeadGenerationIngestInput = RunYellowPagesApifyImportInput;

export type RunUnifiedIngestThroughLinkedInOutcome =
  | { ok: false; error: string }
  | {
      ok: true;
      stopped: "no_leads";
      coordinatorBatchId: string;
      mapsBatchId: string;
      generatedAccepted: number;
      yellowPatched: number;
      linkedInUpdated: number;
      warnings: string[];
    }
  | {
      ok: true;
      stopped: null;
      coordinatorBatchId: string;
      mapsBatchId: string;
      generatedAccepted: number;
      yellowPatched: number;
      linkedInUpdated: number;
      warnings: string[];
    };

/**
 * Phase commune : multi-source (Maps + PJ différée si actor configuré), fusion, scoring lot, PJ, LinkedIn.
 * Parcours tolérant (warnings) pour le cockpit « générer » — ne persiste pas `lead_generation_pipeline_runs`.
 */
export async function runUnifiedLeadGenerationIngestThroughLinkedIn(
  input: UnifiedLeadGenerationIngestInput,
  _options?: { persistPipelineRun?: boolean },
): Promise<RunUnifiedIngestThroughLinkedInOutcome> {
  void _options;
  const deferYellow = Boolean(getYellowPagesActorId());
  const warnings: string[] = [];
  const onWarning = (w: string) => {
    warnings.push(w);
  };

  let coordinatorBatchId = "";
  let mapsBatchId = "";

  try {
    const mapsOutcome = await executeUnifiedMapsPhase(input, { deferYellowPages: deferYellow });
    coordinatorBatchId = mapsOutcome.coordinatorBatchId;
    mapsBatchId = mapsOutcome.mapsBatchId;
    let generatedAccepted = mapsOutcome.acceptedCount;

    if (generatedAccepted === 0) {
      await countLeadGenerationStockNeedingContactImprovementForBatch(coordinatorBatchId);
      return {
        ok: true,
        stopped: "no_leads",
        coordinatorBatchId,
        mapsBatchId,
        generatedAccepted: 0,
        yellowPatched: 0,
        linkedInUpdated: 0,
        warnings,
      };
    }

    const yp = await executeUnifiedYellowPagesPhase(input, coordinatorBatchId, {
      strict: false,
      onWarning,
    });
    if (!("patchedCount" in yp)) {
      return { ok: false, error: yp.message };
    }

    const li = await executeUnifiedLinkedInPhase(coordinatorBatchId, { strict: false, onWarning });
    if (!("updatedCount" in li)) {
      return { ok: false, error: li.message };
    }

    return {
      ok: true,
      stopped: null,
      coordinatorBatchId,
      mapsBatchId,
      generatedAccepted,
      yellowPatched: yp.patchedCount,
      linkedInUpdated: li.updatedCount,
      warnings,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Parcours interrompu.";
    return { ok: false, error: msg };
  }
}
