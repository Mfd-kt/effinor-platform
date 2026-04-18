"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";

import {
  enrichLeadGenerationDecisionMaker,
  type EnrichLeadGenerationDecisionMakerResult,
} from "../enrichment/enrich-lead-generation-decision-maker";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { stockIdParamSchema } from "../schemas/lead-generation-actions.schema";

export async function identifyLeadGenerationDecisionMakerAction(
  input: unknown,
): Promise<LeadGenerationActionResult<EnrichLeadGenerationDecisionMakerResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessAdminCeeSheets(access)) {
    return { ok: false, error: "Accès réservé aux utilisateurs autorisés." };
  }

  const parsed = stockIdParamSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Identifiant fiche invalide." };
  }

  try {
    const data = await enrichLeadGenerationDecisionMaker({ stockId: parsed.data.stockId });
    if (data.status === "failed" && data.error) {
      return { ok: false, error: data.error };
    }
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l’identification du décideur.";
    return { ok: false, error: message };
  }
}
