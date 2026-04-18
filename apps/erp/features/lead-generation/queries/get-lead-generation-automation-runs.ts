import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

export type LeadGenerationAutomationRunListItem = {
  id: string;
  automationType: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  summary: Record<string, unknown>;
  errorSummary: string | null;
};

export async function getLeadGenerationAutomationRuns(limit = 5): Promise<LeadGenerationAutomationRunListItem[]> {
  const cap = Math.min(Math.max(1, limit), 50);
  const supabase = await createClient();
  const table = lgTable(supabase, "lead_generation_automation_runs");

  const { data, error } = await table
    .select("id, automation_type, status, started_at, finished_at, created_at, summary, error_summary")
    .order("created_at", { ascending: false })
    .limit(cap);

  if (error) {
    throw new Error(`Historique automatisations : ${error.message}`);
  }

  return (data ?? []).map((r) => {
    const row = r as {
      id: string;
      automation_type: string;
      status: string;
      started_at: string;
      finished_at: string | null;
      created_at: string;
      summary: Record<string, unknown> | null;
      error_summary: string | null;
    };
    return {
      id: row.id,
      automationType: row.automation_type,
      status: row.status,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      createdAt: row.created_at,
      summary: row.summary && typeof row.summary === "object" && !Array.isArray(row.summary) ? row.summary : {},
      errorSummary: row.error_summary,
    };
  });
}
