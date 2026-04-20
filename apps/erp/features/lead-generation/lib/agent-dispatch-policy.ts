import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeadGenerationDispatchPolicyConfig } from "../domain/lead-generation-dispatch-policy-config";
import { getLeadGenerationDispatchPolicyConfig } from "../queries/get-lead-generation-dispatch-policy-config";
import { lgTable } from "./lg-db";

const ACTIVE = ["assigned", "opened", "in_progress"] as const;

export type LeadGenerationDispatchPolicyResult = {
  suspendInjection: boolean;
  suspensionReason: string | null;
  /** Multiplicateur brut (avant borne plafond effectif). */
  effectiveCapMultiplier: number;
  /** Plafond effectif arrondi, aligné SQL cockpit et RPC. */
  effectiveStockCap: number;
  /** Config utilisée pour ce calcul (pour callers avancés). */
  policyConfig: LeadGenerationDispatchPolicyConfig;
};

/**
 * Plafond effectif pour « Mes fiches » — paramètres issus de {@link getLeadGenerationDispatchPolicyConfig}.
 */
export function computeEffectiveLeadGenStockCap(
  config: LeadGenerationDispatchPolicyConfig,
  multiplier: number,
): number {
  const m = Number.isFinite(multiplier) ? multiplier : 1;
  return Math.min(
    config.effectiveCapMax,
    Math.max(config.effectiveCapMin, Math.round(config.capBasePerCeeSheet * m)),
  );
}

/**
 * Politique d’injection dynamique : suspend si suivi / retards trop lourds,
 * sinon multiplicateur de plafond selon le respect des SLA.
 * Paramètres : table `lead_generation_dispatch_policy_config` (id=1).
 */
export async function getLeadGenerationDispatchPolicy(
  supabase: SupabaseClient,
  agentId: string,
): Promise<LeadGenerationDispatchPolicyResult> {
  const cfg = await getLeadGenerationDispatchPolicyConfig(supabase);
  const t = lgTable(supabase, "lead_generation_assignments");

  const [backlogRes, breachedRes, pendingRes] = await Promise.all([
    t
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("outcome", "pending")
      .in("assignment_status", [...ACTIVE])
      .in("commercial_pipeline_status", ["contacted", "follow_up"]),
    t
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("outcome", "pending")
      .in("assignment_status", [...ACTIVE])
      .eq("sla_status", "breached"),
    t
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("outcome", "pending")
      .in("assignment_status", [...ACTIVE]),
  ]);

  for (const r of [backlogRes, breachedRes, pendingRes]) {
    if (r.error) {
      throw new Error(`Politique dispatch lead-gen : ${r.error.message}`);
    }
  }

  const backlog = backlogRes.count ?? 0;
  const breached = breachedRes.count ?? 0;
  const pending = pendingRes.count ?? 0;

  if (backlog >= cfg.pipelineBacklogSuspendThreshold) {
    return {
      suspendInjection: true,
      suspensionReason: `Suivi saturé (${backlog} fiches Contacté / À rappeler). Traitez avant nouvelle injection.`,
      effectiveCapMultiplier: 1,
      effectiveStockCap: computeEffectiveLeadGenStockCap(cfg, 1),
      policyConfig: cfg,
    };
  }

  if (breached >= cfg.slaBreachedSuspendThreshold) {
    return {
      suspendInjection: true,
      suspensionReason: `Trop d’échéances en retard (${breached}).`,
      effectiveCapMultiplier: 1,
      effectiveStockCap: computeEffectiveLeadGenStockCap(cfg, 1),
      policyConfig: cfg,
    };
  }

  const breachRatio = pending > 0 ? breached / pending : 0;
  let effectiveCapMultiplier = 1;
  if (breachRatio >= cfg.breachRatioPenaltyThreshold) {
    effectiveCapMultiplier = cfg.capMultiplierPenalty;
  } else if (breachRatio <= cfg.breachRatioBonusThreshold && pending >= cfg.minPendingAssignmentsForBonus) {
    effectiveCapMultiplier = cfg.capMultiplierBonus;
  }

  return {
    suspendInjection: false,
    suspensionReason: null,
    effectiveCapMultiplier,
    effectiveStockCap: computeEffectiveLeadGenStockCap(cfg, effectiveCapMultiplier),
    policyConfig: cfg,
  };
}
