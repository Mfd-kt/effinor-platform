import { createClient } from "@/lib/supabase/server";

import { computeAgentActiveStockForCeeSheet } from "../lib/compute-agent-active-stock";
import { listImportBatchIdsForQuantificationOwner } from "../lib/quantification-batch-ownership";
import type { QuantificationImportBatchScope } from "../lib/quantification-viewer-scope";
import { lgTable } from "../lib/lg-db";
import { countDispatchableReadyNowPoolWithFilters } from "../services/auto-dispatch-lead-generation-stock-round-robin";
import { getLeadGenerationAssignableAgents } from "./get-lead-generation-assignable-agents";
import { getLeadGenerationCeeImportScope } from "./get-lead-generation-cee-import-scope";
import { getLeadGenerationDispatchPolicyConfig } from "./get-lead-generation-dispatch-policy-config";

export type LeadGenerationQuantifierCeeOverviewRow = {
  ceeSheetId: string;
  ceeSheetCode: string;
  toValidateCount: number;
  qualifiedReadyNowPool: number;
  /** Plafond métier : fiches actives par commercial et par fiche CEE. */
  perAgentActiveCap: number;
  /** Charge max observée sur un commercial pour cette fiche (assignations actives). */
  maxActiveAssignmentsAmongAgents: number | null;
  /** Places restantes côté commercial le plus chargé (min(cap − actif)). */
  remainingSlotsBottleneck: number | null;
};

/**
 * Synthèse par fiche CEE : fiches à valider (quantification) et volume dispatchable (qualifiés, file prêt maintenant).
 */
export async function getLeadGenerationQuantifierCeeOverview(
  batchScope: QuantificationImportBatchScope = { mode: "all" },
): Promise<LeadGenerationQuantifierCeeOverviewRow[]> {
  const scope = await getLeadGenerationCeeImportScope();
  if (scope.sheets.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const dispatchCfg = await getLeadGenerationDispatchPolicyConfig(supabase);
  const capBase = dispatchCfg.capBasePerCeeSheet;
  const batches = lgTable(supabase, "lead_generation_import_batches");
  const stock = lgTable(supabase, "lead_generation_stock");
  const agents = await getLeadGenerationAssignableAgents();

  let ownerBatchIdSet: Set<string> | null = null;
  if (batchScope.mode === "own") {
    const mine = await listImportBatchIdsForQuantificationOwner(supabase, batchScope.userId);
    ownerBatchIdSet = new Set(mine);
  }

  const out: LeadGenerationQuantifierCeeOverviewRow[] = [];

  for (const sheet of scope.sheets) {
    const { data: batchRows, error: bErr } = await batches.select("id").eq("cee_sheet_id", sheet.id);
    if (bErr) {
      throw new Error(bErr.message);
    }
    let batchIds = (batchRows ?? []).map((r: { id: string }) => r.id).filter(Boolean);
    if (ownerBatchIdSet) {
      batchIds = batchIds.filter((id) => ownerBatchIdSet!.has(id));
    }
    let toValidateCount = 0;
    if (batchIds.length > 0) {
      const { count, error: cErr } = await stock
        .select("*", { count: "exact", head: true })
        .in("import_batch_id", batchIds)
        .in("qualification_status", ["to_validate", "pending"]);
      if (cErr) {
        throw new Error(cErr.message);
      }
      toValidateCount = count ?? 0;
    }

    const qualifiedReadyNowPool = await countDispatchableReadyNowPoolWithFilters({
      cee_sheet_id: sheet.id,
    });

    let maxActiveAssignmentsAmongAgents: number | null = null;
    let remainingSlotsBottleneck: number | null = null;
    if (agents.length > 0) {
      let maxActive = 0;
      let minRemaining = capBase;
      for (const agent of agents) {
        const { count: active } = await computeAgentActiveStockForCeeSheet(supabase, agent.id, sheet.id);
        maxActive = Math.max(maxActive, active);
        minRemaining = Math.min(
          minRemaining,
          Math.max(0, capBase - active),
        );
      }
      maxActiveAssignmentsAmongAgents = maxActive;
      remainingSlotsBottleneck = minRemaining;
    }

    out.push({
      ceeSheetId: sheet.id,
      ceeSheetCode: sheet.code?.trim() || sheet.id,
      toValidateCount,
      qualifiedReadyNowPool,
      perAgentActiveCap: capBase,
      maxActiveAssignmentsAmongAgents,
      remainingSlotsBottleneck,
    });
  }

  return out;
}
