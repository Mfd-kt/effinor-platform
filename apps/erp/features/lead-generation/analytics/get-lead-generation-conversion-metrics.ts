import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

const DAYS_7_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_LIMIT = 10;

export type LeadGenerationConversionMetrics = {
  totalConvertedStock: number;
  totalStock: number;
  conversionRatePct: number;
  convertedLast7Days: number;
  recentConversions: Array<{
    stockId: string;
    source: string;
    convertedLeadId: string;
    convertedAt: string;
  }>;
  bySource: Array<{ source: string; converted: number }>;
};

export async function getLeadGenerationConversionMetrics(): Promise<LeadGenerationConversionMetrics> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const [{ count: totalStock, error: totalErr }, { data: convertedRows, error: convertedErr }] = await Promise.all([
    stock.select("id", { count: "exact", head: true }),
    stock
      .select("id, source, converted_lead_id, updated_at")
      .not("converted_lead_id", "is", null)
      .order("updated_at", { ascending: false }),
  ]);

  if (totalErr) throw new Error(`Metrics conversion lead-generation (stock total): ${totalErr.message}`);
  if (convertedErr) throw new Error(`Metrics conversion lead-generation: ${convertedErr.message}`);

  const converted = (convertedRows ?? []) as Array<{
    id: string;
    source: string;
    converted_lead_id: string;
    updated_at: string;
  }>;
  const totalConvertedStock = converted.length;
  const totalStockValue = totalStock ?? 0;
  const conversionRatePct =
    totalStockValue === 0 ? 0 : Math.round((totalConvertedStock / totalStockValue) * 1000) / 10;

  const now = Date.now();
  const convertedLast7Days = converted.filter(
    (r) => now - new Date(r.updated_at).getTime() <= DAYS_7_MS,
  ).length;

  const bySourceMap = new Map<string, number>();
  for (const row of converted) {
    bySourceMap.set(row.source, (bySourceMap.get(row.source) ?? 0) + 1);
  }

  return {
    totalConvertedStock,
    totalStock: totalStockValue,
    conversionRatePct,
    convertedLast7Days,
    recentConversions: converted.slice(0, RECENT_LIMIT).map((r) => ({
      stockId: r.id,
      source: r.source,
      convertedLeadId: r.converted_lead_id,
      convertedAt: r.updated_at,
    })),
    bySource: Array.from(bySourceMap.entries())
      .map(([source, convertedCount]) => ({ source, converted: convertedCount }))
      .sort((a, b) => b.converted - a.converted),
  };
}
