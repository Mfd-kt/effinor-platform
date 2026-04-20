"use server";

import { getAccessContext } from "@/lib/auth/access-context";

import {
  extractVerifiedLeadGenerationEnrichment,
  type ExtractVerifiedLeadGenerationEnrichmentResult,
} from "../firecrawl/extract-verified-enrichment";
import { canRunLeadGenerationStockEnrichment } from "../lib/lead-generation-enrichment-access";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { stockIdParamSchema } from "../schemas/lead-generation-actions.schema";

export async function enrichLeadGenerationStockVerifiedAction(
  input: unknown,
): Promise<LeadGenerationActionResult<ExtractVerifiedLeadGenerationEnrichmentResult>> {
  const access = await getAccessContext();
  if (!(await canRunLeadGenerationStockEnrichment(access))) {
    return { ok: false, error: "Enrichissement réservé au pilotage lead generation." };
  }

  const parsed = stockIdParamSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Identifiant fiche invalide." };
  }

  try {
    const data = await extractVerifiedLeadGenerationEnrichment({ stockId: parsed.data.stockId });
    if (data.status === "failed" && data.error) {
      return { ok: false, error: data.error };
    }
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de la vérification via le site.";
    return { ok: false, error: message };
  }
}
