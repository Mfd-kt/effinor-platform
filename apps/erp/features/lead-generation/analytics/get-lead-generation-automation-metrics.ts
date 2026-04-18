import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

const RECENT_LIMIT = 10;
const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

type RunRow = {
  id: string;
  automation_type: string;
  status: string;
  created_at: string;
  error_summary: string | null;
};

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

export type LeadGenerationAutomationMetrics = {
  totalRuns: number;
  runsLast30Days: number;
  byType: CountBreakdown;
  byStatus: CountBreakdown;
  recentRuns: RunRow[];
  recentFailures: RunRow[];
};

export async function getLeadGenerationAutomationMetrics(): Promise<LeadGenerationAutomationMetrics> {
  const supabase = await createClient();
  const runs = lgTable(supabase, "lead_generation_automation_runs");

  const [{ data, error }, { data: recentRuns, error: recentErr }] = await Promise.all([
    runs.select("id, automation_type, status, created_at, error_summary").order("created_at", { ascending: false }),
    runs
      .select("id, automation_type, status, created_at, error_summary")
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
  ]);

  if (error) throw new Error(`Metrics automatisations lead-generation: ${error.message}`);
  if (recentErr) throw new Error(`Metrics runs récents lead-generation: ${recentErr.message}`);

  const rows = (data ?? []) as RunRow[];
  const now = Date.now();
  const runsLast30Days = rows.filter((r) => now - new Date(r.created_at).getTime() <= DAYS_30_MS).length;
  const failures = rows.filter((r) => r.status === "failed" && r.error_summary);

  return {
    totalRuns: rows.length,
    runsLast30Days,
    byType: groupCount(rows, "automation_type"),
    byStatus: groupCount(rows, "status"),
    recentRuns: (recentRuns ?? []) as RunRow[],
    recentFailures: failures.slice(0, 5),
  };
}
