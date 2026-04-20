import type { SupabaseClient } from "@supabase/supabase-js";

import { COMMERCIAL_PIPELINE_ACTIVE_STOCK_STATUS } from "../domain/commercial-pipeline-status";

import { lgTable } from "./lg-db";

const ACTIVE_STATUSES = ["assigned", "opened", "in_progress"] as const;

export type AgentActiveStockSnapshot = {
  count: number;
};

/**
 * Stock **neuf** pour un agent : assignations `pending` au pipeline `new` uniquement
 * (base réinjection / dispatch jusqu’au plafond).
 */
export async function computeAgentActiveStock(
  supabase: SupabaseClient,
  agentId: string,
): Promise<AgentActiveStockSnapshot> {
  const t = lgTable(supabase, "lead_generation_assignments");

  const { count, error } = await t
    .select("*", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .in("assignment_status", [...ACTIVE_STATUSES])
    .eq("outcome", "pending")
    .eq("commercial_pipeline_status", COMMERCIAL_PIPELINE_ACTIVE_STOCK_STATUS);

  if (error) {
    throw new Error(`Stock actif agent : ${error.message}`);
  }

  return { count: count ?? 0 };
}

/**
 * Fiches actives de l’agent pour une fiche CEE (stock issu d’un lot rattaché à cette fiche).
 */
export async function computeAgentActiveStockForCeeSheet(
  supabase: SupabaseClient,
  agentId: string,
  ceeSheetId: string,
): Promise<AgentActiveStockSnapshot> {
  const sheet = ceeSheetId.trim();
  if (!sheet) {
    return { count: 0 };
  }

  const { data, error } = await supabase.rpc("count_lead_generation_agent_active_stock_for_cee_sheet", {
    p_agent_id: agentId,
    p_cee_sheet_id: sheet,
  });

  if (error) {
    throw new Error(`Stock actif agent (fiche CEE) : ${error.message}`);
  }

  const n = typeof data === "number" ? data : Number(data);
  return { count: Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0 };
}
