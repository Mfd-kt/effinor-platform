import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

import { applyLeadGenerationStockFilters } from "./apply-lead-generation-stock-filters";
import { stableStockFiltersKey, type GetLeadGenerationStockFilters } from "./get-lead-generation-stock";

const STOCK_STATUS_KEYS = [
  "new",
  "ready",
  "assigned",
  "in_progress",
  "converted",
  "rejected",
  "expired",
  "archived",
] as const;

const DISPATCH_QUEUE_KEYS = ["ready_now", "enrich_first", "review", "low_value", "do_not_dispatch"] as const;

export type LeadGenerationStockSummary = {
  totalMatching: number;
  byStockStatus: Partial<Record<(typeof STOCK_STATUS_KEYS)[number], number>>;
  byDispatchQueue: Partial<Record<(typeof DISPATCH_QUEUE_KEYS)[number], number>>;
};

async function getLeadGenerationStockSummaryImpl(
  filterKey: string,
): Promise<LeadGenerationStockSummary> {
  const filters: GetLeadGenerationStockFilters | undefined =
    filterKey === "null" ? undefined : (JSON.parse(filterKey) as GetLeadGenerationStockFilters);
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  let base = stock.select("*", { count: "exact", head: true });
  base = applyLeadGenerationStockFilters(base, filters);
  const { count: totalMatching, error: errTotal } = await base;
  if (errTotal) {
    throw new Error(`Comptage stock lead generation : ${errTotal.message}`);
  }

  const byStockStatus: LeadGenerationStockSummary["byStockStatus"] = {};
  const byDispatchQueue: LeadGenerationStockSummary["byDispatchQueue"] = {};

  const stockTasks = STOCK_STATUS_KEYS.map(async (status) => {
    let q = stock.select("*", { count: "exact", head: true });
    q = applyLeadGenerationStockFilters(q, filters);
    q = q.eq("stock_status", status);
    const { count, error } = await q;
    if (error) throw new Error(`Comptage stock par statut : ${error.message}`);
    if ((count ?? 0) > 0) byStockStatus[status] = count ?? 0;
  });

  const dispatchTasks = DISPATCH_QUEUE_KEYS.map(async (status) => {
    let q = stock.select("*", { count: "exact", head: true });
    q = applyLeadGenerationStockFilters(q, filters);
    q = q.eq("dispatch_queue_status", status);
    const { count, error } = await q;
    if (error) throw new Error(`Comptage file dispatch : ${error.message}`);
    if ((count ?? 0) > 0) byDispatchQueue[status] = count ?? 0;
  });

  await Promise.all([...stockTasks, ...dispatchTasks]);

  return {
    totalMatching: totalMatching ?? 0,
    byStockStatus,
    byDispatchQueue,
  };
}

const getLeadGenerationStockSummaryCached = cache((filterKey: string) =>
  getLeadGenerationStockSummaryImpl(filterKey),
);

/**
 * Compte total et répartition par statuts (mêmes filtres que la liste).
 */
export async function getLeadGenerationStockSummary(
  filters: GetLeadGenerationStockFilters | undefined,
): Promise<LeadGenerationStockSummary> {
  return getLeadGenerationStockSummaryCached(stableStockFiltersKey(filters));
}
