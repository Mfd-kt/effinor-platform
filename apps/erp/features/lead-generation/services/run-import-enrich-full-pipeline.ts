// TODO: Reimplement when a new external scraping integration replaces Apify Google Maps.

export type RunGoogleMapsApifyImportInput = Record<string, unknown>;

export type RunImportEnrichFullPipelineResult = {
  coordinatorBatchId: string;
  mapsBatchId: string;
  fusionAcceptedCount: number;
  commercialScoredTotal: number;
  linkedIn: {
    status: "skipped" | "completed" | "pending_sync";
    batchId?: string;
    targetCount?: number;
    stocksUpdated?: number;
    reason?: string;
    note?: string;
  };
  timedOutWaitingApify: boolean;
};

export async function runImportEnrichFullPipeline(
  _input: RunGoogleMapsApifyImportInput,
): Promise<RunImportEnrichFullPipelineResult> {
  throw new Error(
    "Pipeline d'import Google Maps désactivé : la nouvelle source d'acquisition n'est pas encore branchée.",
  );
}
