"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import { identifyPremiumLeadGenerationDecisionMakersBatchActionInputSchema } from "../schemas/lead-generation-actions.schema";
import {
  identifyPremiumLeadGenerationDecisionMakersBatch,
  type IdentifyPremiumLeadGenerationDecisionMakersBatchSummary,
} from "../services/identify-premium-lead-generation-decision-makers-batch";

export async function identifyPremiumLeadGenerationDecisionMakersBatchAction(
  input: unknown,
): Promise<LeadGenerationActionResult<IdentifyPremiumLeadGenerationDecisionMakersBatchSummary>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès réservé aux utilisateurs autorisés." };
  }

  const parsed = identifyPremiumLeadGenerationDecisionMakersBatchActionInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const data = await identifyPremiumLeadGenerationDecisionMakersBatch({
      limit: parsed.data.limit,
    });
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors de l’identification des décideurs premium.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
