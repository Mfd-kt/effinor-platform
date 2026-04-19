import type { LeadGenerationStockRow } from "../domain/stock-row";

import { mergeDropcontactIntoStock } from "./merge-dropcontact-into-stock";

/**
 * Applique la réponse Dropcontact (contact enrichi) + finalise le cycle `dropcontact_*`.
 */
export function applyDropcontactResultToLead(
  row: LeadGenerationStockRow,
  contactRaw: Record<string, unknown>,
): { patch: Record<string, unknown>; hasUsefulData: boolean } {
  const merged = mergeDropcontactIntoStock(row, contactRaw);
  const completedAt = new Date().toISOString();
  const errMsg =
    typeof merged.patch.enrichment_error === "string"
      ? merged.patch.enrichment_error
      : "Dropcontact n’a pas trouvé de données exploitables.";

  return {
    patch: {
      ...merged.patch,
      dropcontact_status: merged.hasUsefulData ? "completed" : "failed",
      dropcontact_completed_at: completedAt,
      dropcontact_last_error: merged.hasUsefulData ? null : errMsg,
    },
    hasUsefulData: merged.hasUsefulData,
  };
}
