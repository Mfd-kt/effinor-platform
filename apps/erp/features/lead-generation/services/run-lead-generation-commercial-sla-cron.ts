import { createAdminClient } from "@/lib/supabase/admin";

import { lgTable } from "../lib/lg-db";

import { refreshLeadGenerationAssignmentSla } from "./refresh-lead-generation-assignment-sla";

export type LeadGenerationCommercialSlaCronResult = {
  scanned: number;
  refreshed: number;
  failed: number;
  durationMs: number;
};

const DEFAULT_LIMIT = 400;

/**
 * Recalcule le SLA pour les assignations actives (cron). Les notifications Slack
 * ne partent que sur transition vers breached (voir refresh).
 */
export async function runLeadGenerationCommercialSlaCron(input?: {
  limit?: number;
}): Promise<LeadGenerationCommercialSlaCronResult> {
  const t0 = Date.now();
  const supabase = createAdminClient();
  const t = lgTable(supabase, "lead_generation_assignments");
  const limit = Math.min(Math.max(1, input?.limit ?? DEFAULT_LIMIT), 2000);

  const { data, error } = await t
    .select("id")
    .eq("outcome", "pending")
    .in("assignment_status", ["assigned", "opened", "in_progress"])
    .is("created_lead_id", null)
    .neq("commercial_pipeline_status", "converted")
    .limit(limit);

  if (error) {
    throw new Error(`Cron SLA lead generation : ${error.message}`);
  }

  const ids = (data ?? []).map((r) => (r as { id: string }).id);
  let refreshed = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      await refreshLeadGenerationAssignmentSla(supabase, id, { notifyOnBreach: true });
      refreshed += 1;
    } catch {
      failed += 1;
    }
  }

  return {
    scanned: ids.length,
    refreshed,
    failed,
    durationMs: Date.now() - t0,
  };
}
