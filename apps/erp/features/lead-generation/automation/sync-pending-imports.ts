// TODO: Reimplement when a new external scraping integration replaces Apify Google Maps.

export type SyncPendingImportsJobSummary = {
  totalScanned: number;
  totalCompleted: number;
  totalStillRunning: number;
  totalFailed: number;
  batchIds: string[];
  details: Array<{
    batchId: string;
    phase: string;
    ingestedCount?: number;
    acceptedCount?: number;
  }>;
};

export async function runSyncPendingImportsJob(): Promise<SyncPendingImportsJobSummary> {
  console.info("[lead-generation] runSyncPendingImportsJob skipped: pas d'imports Apify actifs dans cette version.");
  return {
    totalScanned: 0,
    totalCompleted: 0,
    totalStillRunning: 0,
    totalFailed: 0,
    batchIds: [],
    details: [],
  };
}
