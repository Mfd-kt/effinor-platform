"use server";

import { getAccessContext } from "@/lib/auth/access-context";

import {
  extractVerifiedLeadGenerationEnrichmentBatch,
  type ExtractVerifiedLeadGenerationEnrichmentResult,
} from "../firecrawl/extract-verified-enrichment";
import { canRunLeadGenerationStockEnrichment } from "../lib/lead-generation-enrichment-access";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { enrichLeadGenerationStockVerifiedBatchActionInputSchema } from "../schemas/lead-generation-actions.schema";

export type VerifiedBatchActionResult = {
  processed: number;
  details: ExtractVerifiedLeadGenerationEnrichmentResult[];
};

export async function enrichLeadGenerationStockVerifiedBatchAction(
  input: unknown,
): Promise<LeadGenerationActionResult<VerifiedBatchActionResult>> {
  const access = await getAccessContext();
  if (!(await canRunLeadGenerationStockEnrichment(access))) {
    return { ok: false, error: "Enrichissement réservé au pilotage lead generation." };
  }

  const parsed = enrichLeadGenerationStockVerifiedBatchActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Liste de fiches invalide." };
  }

  try {
    const data = await extractVerifiedLeadGenerationEnrichmentBatch(parsed.data.stockIds);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du lot de vérification.";
    return { ok: false, error: message };
  }
}
