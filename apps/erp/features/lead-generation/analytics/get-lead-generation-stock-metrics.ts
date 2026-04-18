import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

type CountBreakdown = Array<{ key: string; count: number }>;

function groupCount<T extends Record<string, unknown>>(rows: T[], key: keyof T): CountBreakdown {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = String(row[key] ?? "unknown");
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([k, count]) => ({ key: k, count }))
    .sort((a, b) => b.count - a.count);
}

export type LeadGenerationStockMetrics = {
  totalStock: number;
  byStockStatus: CountBreakdown;
  byQualificationStatus: CountBreakdown;
  byDispatchQueueStatus: CountBreakdown;
  byCommercialPriority: CountBreakdown;
  byEnrichmentConfidence: CountBreakdown;
};

export async function getLeadGenerationStockMetrics(): Promise<LeadGenerationStockMetrics> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const { data, error } = await stock.select(
    "stock_status, qualification_status, dispatch_queue_status, commercial_priority, enrichment_confidence",
  );
  if (error) {
    throw new Error(`Metrics stock lead-generation: ${error.message}`);
  }
  const rows = (data ?? []) as Array<{
    stock_status: string;
    qualification_status: string;
    dispatch_queue_status: string;
    commercial_priority: string;
    enrichment_confidence: string;
  }>;
  return {
    totalStock: rows.length,
    byStockStatus: groupCount(rows, "stock_status"),
    byQualificationStatus: groupCount(rows, "qualification_status"),
    byDispatchQueueStatus: groupCount(rows, "dispatch_queue_status"),
    byCommercialPriority: groupCount(rows, "commercial_priority"),
    byEnrichmentConfidence: groupCount(rows, "enrichment_confidence"),
  };
}
