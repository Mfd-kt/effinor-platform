import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";
import {
  evaluateLeadGenerationAssignmentRecycleStatusBatch,
  type EvaluateRecycleBatchSummary,
} from "../recycling/evaluate-recycle-status";

const LIMIT = 50;

export type EvaluateRecyclingActiveAssignmentsJobSummary = EvaluateRecycleBatchSummary & {
  totalEligible: number;
};

/**
 * Assignations actives éligibles au calcul de recyclage (même cible que le quick existant), avec comptage `eligible` après passage.
 */
export async function runEvaluateRecyclingActiveAssignmentsJob(): Promise<EvaluateRecyclingActiveAssignmentsJobSummary> {
  const supabase = await createClient();
  const assignments = lgTable(supabase, "lead_generation_assignments");
  const { settings } = await getLeadGenerationSettings();
  const cap = settings.automationLimits.evaluate_recycling_limit ?? LIMIT;

  const { data, error } = await assignments
    .select("id")
    .in("recycle_status", ["active", "eligible"])
    .in("assignment_status", ["assigned", "opened", "in_progress"])
    .eq("outcome", "pending")
    .is("created_lead_id", null)
    .order("assigned_at", { ascending: true })
    .limit(cap);

  if (error) {
    throw new Error(`Sélection assignations actives : ${error.message}`);
  }

  const ids = (data ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) {
    return {
      totalRequested: 0,
      totalSucceeded: 0,
      totalFailed: 0,
      failedAssignmentIds: [],
      totalEligible: 0,
    };
  }

  const batch = await evaluateLeadGenerationAssignmentRecycleStatusBatch(ids);

  const { count, error: countErr } = await assignments
    .select("id", { count: "exact", head: true })
    .in("id", ids)
    .eq("recycle_status", "eligible");

  if (countErr) {
    throw new Error(`Comptage statut recyclage : ${countErr.message}`);
  }

  return {
    ...batch,
    totalEligible: count ?? 0,
  };
}
