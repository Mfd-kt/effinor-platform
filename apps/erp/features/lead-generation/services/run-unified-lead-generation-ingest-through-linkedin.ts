import { countLeadGenerationStockNeedingContactImprovementForBatch } from "../queries/get-lead-generation-stock-ids-needing-contact-improvement-for-batch";
import { executeUnifiedMapsPhase } from "./unified-pipeline-ingest-phases";

// TODO: Replace with the new external scraping integration input type.
export type UnifiedLeadGenerationIngestInput = Record<string, unknown>;

export type RunUnifiedIngestThroughLinkedInOutcome =
  | { ok: false; error: string }
  | {
      ok: true;
      stopped: "no_leads";
      coordinatorBatchId: string;
      mapsBatchId: string;
      generatedAccepted: number;
      warnings: string[];
    }
  | {
      ok: true;
      stopped: null;
      coordinatorBatchId: string;
      mapsBatchId: string;
      generatedAccepted: number;
      warnings: string[];
    };

/**
 * Phase Maps + ingestion sur le lot (cockpit « générer ») — ne persiste pas `lead_generation_pipeline_runs`.
 */
export async function runUnifiedLeadGenerationIngestThroughLinkedIn(
  input: UnifiedLeadGenerationIngestInput,
  _options?: { persistPipelineRun?: boolean },
): Promise<RunUnifiedIngestThroughLinkedInOutcome> {
  void _options;
  const warnings: string[] = [];

  let coordinatorBatchId = "";
  let mapsBatchId = "";

  try {
    const mapsOutcome = await executeUnifiedMapsPhase(input);
    coordinatorBatchId = mapsOutcome.coordinatorBatchId;
    mapsBatchId = mapsOutcome.mapsBatchId;
    const generatedAccepted = mapsOutcome.acceptedCount;

    if (generatedAccepted === 0) {
      await countLeadGenerationStockNeedingContactImprovementForBatch(coordinatorBatchId);
      return {
        ok: true,
        stopped: "no_leads",
        coordinatorBatchId,
        mapsBatchId,
        generatedAccepted: 0,
        warnings,
      };
    }

    return {
      ok: true,
      stopped: null,
      coordinatorBatchId,
      mapsBatchId,
      generatedAccepted,
      warnings,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Parcours interrompu.";
    return { ok: false, error: msg };
  }
}
