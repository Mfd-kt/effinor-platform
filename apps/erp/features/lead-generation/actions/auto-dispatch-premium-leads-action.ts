"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import type { PremiumAutoDispatchLeadsResult } from "../domain/main-actions-result";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import { getLeadGenerationAssignableAgents } from "../queries/get-lead-generation-assignable-agents";
import { autoDispatchPremiumLeadsActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";
import {
  autoDispatchPremiumLeadGenerationStockRoundRobin,
  countDispatchablePremiumReadyNowPool,
} from "../services/auto-dispatch-premium-lead-generation-stock-round-robin";

export async function autoDispatchPremiumLeadsAction(
  input: unknown,
): Promise<LeadGenerationActionResult<PremiumAutoDispatchLeadsResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  const parsed = autoDispatchPremiumLeadsActionInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const { settings } = await getLeadGenerationSettings();
    const agents = await getLeadGenerationAssignableAgents();
    if (agents.length === 0) {
      return { ok: false, error: "Aucun agent disponible pour la distribution." };
    }
    const pool = await countDispatchablePremiumReadyNowPool();
    if (pool === 0) {
      return { ok: false, error: "Aucun lead premium prêt à distribuer." };
    }
    const cap = parsed.data.maxActiveStockPerAgent ?? settings.mainActionsDefaults.agent_stock_cap;
    const data = await autoDispatchPremiumLeadGenerationStockRoundRobin({
      agents,
      maxActiveStockPerAgent: cap,
    });
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors de la distribution premium.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
