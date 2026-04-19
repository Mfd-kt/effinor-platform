import type { LeadGenerationImportBatchRow } from "../queries/get-lead-generation-import-batch-by-id";

export type LeadGenerationImportSyncRetryEligibility =
  | { retryable: true }
  | { retryable: false; userMessage: string };

function hasApifyRunRef(row: { external_run_id: string | null; job_reference: string | null }): boolean {
  return Boolean(row.external_run_id?.trim() || row.job_reference?.trim());
}

/**
 * Indique si un lot `failed` peut recevoir une resynchronisation manuelle (références Apify encore présentes).
 */
export function assessLeadGenerationImportSyncRetryEligibility(
  row: LeadGenerationImportBatchRow,
): LeadGenerationImportSyncRetryEligibility {
  if (row.status !== "failed") {
    return { retryable: false, userMessage: "Ce lot n’est pas en erreur." };
  }

  const src = row.source;
  if (src !== "apify_google_maps") {
    return { retryable: false, userMessage: "Ce type d’import ne peut pas être relancé depuis cet écran." };
  }

  if (!hasApifyRunRef(row)) {
    return {
      retryable: false,
      userMessage: "Ce lot ne contient plus les informations nécessaires pour un nouvel essai.",
    };
  }

  return { retryable: true };
}
