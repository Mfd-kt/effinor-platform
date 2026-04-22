"use server";

import type { LeadGenerationActionResult } from "../lib/action-result";

export type RetryLeadGenerationImportSyncOutcome =
  | "retried_success"
  | "still_failed"
  | "not_retryable"
  | "no_recoverable_data"
  | "still_in_progress";

export type RetryLeadGenerationImportSyncActionPayload = {
  outcome: RetryLeadGenerationImportSyncOutcome;
  message: string;
  batchStatus?: string | null;
};

// TODO: Reimplement when a new external scraping integration replaces Apify Google Maps.
export async function retryLeadGenerationImportSyncAction(
  _input: unknown,
): Promise<LeadGenerationActionResult<RetryLeadGenerationImportSyncActionPayload>> {
  return {
    ok: true,
    data: {
      outcome: "not_retryable",
      message: "Apify Google Maps désactivé : la nouvelle source d'acquisition n'est pas encore branchée.",
    },
  };
}
