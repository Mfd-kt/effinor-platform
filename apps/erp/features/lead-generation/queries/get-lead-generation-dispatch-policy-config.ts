import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeadGenerationDispatchPolicyConfig } from "../domain/lead-generation-dispatch-policy-config";
import { lgTable } from "../lib/lg-db";

type Row = {
  id: number;
  pipeline_backlog_suspend_threshold: number;
  sla_breached_suspend_threshold: number;
  breach_ratio_penalty_threshold: number;
  breach_ratio_bonus_threshold: number;
  min_pending_assignments_for_bonus: number;
  cap_multiplier_penalty: number;
  cap_multiplier_bonus: number;
  cap_base_per_cee_sheet: number;
  effective_cap_min: number;
  effective_cap_max: number;
  updated_at: string;
  updated_by: string | null;
};

function mapRow(r: Row): LeadGenerationDispatchPolicyConfig {
  return {
    id: r.id,
    pipelineBacklogSuspendThreshold: r.pipeline_backlog_suspend_threshold,
    slaBreachedSuspendThreshold: r.sla_breached_suspend_threshold,
    breachRatioPenaltyThreshold: Number(r.breach_ratio_penalty_threshold),
    breachRatioBonusThreshold: Number(r.breach_ratio_bonus_threshold),
    minPendingAssignmentsForBonus: r.min_pending_assignments_for_bonus,
    capMultiplierPenalty: Number(r.cap_multiplier_penalty),
    capMultiplierBonus: Number(r.cap_multiplier_bonus),
    capBasePerCeeSheet: r.cap_base_per_cee_sheet,
    effectiveCapMin: r.effective_cap_min,
    effectiveCapMax: r.effective_cap_max,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
  };
}

/**
 * Lecture stricte de la ligne id=1 — même source que {@link public.lead_generation_dispatch_policy} côté SQL.
 * @throws Si la ligne est absente (fail fast — configuration requise en production).
 */
export async function getLeadGenerationDispatchPolicyConfig(
  supabase: SupabaseClient,
): Promise<LeadGenerationDispatchPolicyConfig> {
  const t = lgTable(supabase, "lead_generation_dispatch_policy_config");
  const { data, error } = await t.select("*").eq("id", 1).maybeSingle();
  if (error) {
    throw new Error(`Configuration dispatch lead-gen : ${error.message}`);
  }
  if (!data) {
    throw new Error(
      "Configuration dispatch lead_generation absente (lead_generation_dispatch_policy_config id=1). Appliquer les migrations.",
    );
  }
  return mapRow(data as Row);
}
