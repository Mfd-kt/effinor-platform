"use server";

import type { z } from "zod";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import type { AutoDispatchLeadsResult } from "../domain/main-actions-result";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import type { GetLeadGenerationStockFilters } from "../queries/get-lead-generation-stock";
import { getLeadGenerationAssignableAgents } from "../queries/get-lead-generation-assignable-agents";
import {
  autoDispatchLeadGenerationStockRoundRobin,
  autoDispatchLeadGenerationStockRoundRobinUntilDry,
  countDispatchableReadyNowPoolWithFilters,
} from "../services/auto-dispatch-lead-generation-stock-round-robin";
import {
  autoDispatchLeadsActionInputSchema,
  leadGenerationDispatchFiltersSchema,
} from "../schemas/lead-generation-actions.schema";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";

/** Lot UI : enrichissement / scoring / file / distribution — même ordre de grandeur. */
const DISPATCH_ASSIGNMENTS_PER_RUN = 100;

type DispatchFiltersInput = z.infer<typeof leadGenerationDispatchFiltersSchema>;

function normalizeDispatchFilters(f: DispatchFiltersInput | undefined): GetLeadGenerationStockFilters | undefined {
  if (!f) return undefined;
  const out: GetLeadGenerationStockFilters = {};
  if (f.company_search?.trim()) out.company_search = f.company_search.trim();
  if (f.stock_status?.trim()) out.stock_status = f.stock_status.trim();
  if (f.qualification_status?.trim()) out.qualification_status = f.qualification_status.trim();
  if (f.source?.trim()) out.source = f.source.trim();
  if (f.city?.trim()) out.city = f.city.trim();
  if (f.dispatch_queue_status?.trim()) out.dispatch_queue_status = f.dispatch_queue_status.trim();
  if (f.lead_tier?.trim()) out.lead_tier = f.lead_tier.trim();
  if (f.closing_readiness_status?.trim()) out.closing_readiness_status = f.closing_readiness_status.trim();
  if (f.needs_contact_improvement === true) out.needs_contact_improvement = true;
  if (f.import_batch_id?.trim()) out.import_batch_id = f.import_batch_id.trim();
  if (f.cee_sheet_id?.trim()) out.cee_sheet_id = f.cee_sheet_id.trim();
  return Object.keys(out).length > 0 ? out : undefined;
}

export async function autoDispatchLeadsAction(
  input: unknown,
): Promise<LeadGenerationActionResult<AutoDispatchLeadsResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  const parsed = autoDispatchLeadsActionInputSchema.safeParse(input ?? {});
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
    const stockFilters = normalizeDispatchFilters(parsed.data.filters);
    const readyPool = await countDispatchableReadyNowPoolWithFilters(stockFilters);
    if (readyPool === 0) {
      return {
        ok: false,
        error: stockFilters
          ? "Aucun lead qualifié disponible pour ces critères (file commerciale « prêt maintenant »)."
          : "Aucun lead qualifié disponible.",
      };
    }
    const data = await autoDispatchLeadGenerationStockRoundRobin({
      agents,
      maxActiveStockPerAgent: settings.mainActionsDefaults.agent_stock_cap,
      stockFilters,
      maxAssignmentsThisRun: DISPATCH_ASSIGNMENTS_PER_RUN,
    });
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors de la distribution automatique.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}

/**
 * Enchaîne des passes de distribution jusqu’à saturation des agents ou épuisement du pool `ready_now`.
 */
export async function autoDispatchAllLeadsAction(
  input: unknown,
): Promise<LeadGenerationActionResult<AutoDispatchLeadsResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès réservé à l’administration." };
  }

  const parsed = autoDispatchLeadsActionInputSchema.safeParse(input ?? {});
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
    const stockFilters = normalizeDispatchFilters(parsed.data.filters);
    const readyPool = await countDispatchableReadyNowPoolWithFilters(stockFilters);
    if (readyPool === 0) {
      return {
        ok: false,
        error: stockFilters
          ? "Aucun lead qualifié disponible pour ces critères (file commerciale « prêt maintenant »)."
          : "Aucun lead qualifié disponible.",
      };
    }
    const out = await autoDispatchLeadGenerationStockRoundRobinUntilDry({
      agents,
      maxActiveStockPerAgent: settings.mainActionsDefaults.agent_stock_cap,
      stockFilters,
      maxTotalAssignments: DISPATCH_ASSIGNMENTS_PER_RUN,
    });
    const data: AutoDispatchLeadsResult = {
      total_assigned: out.total_assigned,
      distribution_par_agent: out.distribution_par_agent,
      remaining_leads: out.remaining_leads,
      agents_considered: out.agents_considered,
      rounds: out.rounds,
    };
    return { ok: true, data };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors de la distribution automatique.";
    return { ok: false, error: humanizeLeadGenerationActionError(raw) };
  }
}
