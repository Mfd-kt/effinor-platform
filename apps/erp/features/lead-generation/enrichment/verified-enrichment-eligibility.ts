import type { LeadGenerationStockRow } from "../domain/stock-row";

/**
 * TODO: Reimplement when a new public-site verification source replaces Firecrawl.
 * Tant que la nouvelle source n'est pas branchée, aucune fiche n'est éligible.
 */
export function isEligibleForVerifiedLeadGenerationEnrichment(
  _row: LeadGenerationStockRow,
): { ok: true } | { ok: false; reason: string } {
  return {
    ok: false,
    reason: "Vérification site indisponible : la nouvelle source publique n'est pas encore branchée.",
  };
}
