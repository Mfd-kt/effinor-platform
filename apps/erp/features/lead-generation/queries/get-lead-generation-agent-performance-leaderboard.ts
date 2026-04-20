import { createClient } from "@/lib/supabase/server";

import { LG_CALL_STARTED_ACTIVITY_LABEL } from "../lib/lg-call-draft";
import { lgTable } from "../lib/lg-db";
import { getLeadGenerationDispatchPolicy } from "../lib/agent-dispatch-policy";
import { getLeadGenerationAssignableAgents } from "./get-lead-generation-assignable-agents";

const ACTIVE = ["assigned", "opened", "in_progress"] as const;

export type LeadGenerationAgentPerformanceRow = {
  agentId: string;
  displayName: string;
  email: string | null;
  freshStock: number;
  pipelineBacklog: number;
  breachedSla: number;
  leadsConverted: number;
  callsLogged: number;
  effectiveStockCap: number;
  suspendInjection: boolean;
  suspensionReason: string | null;
  /** Badge UX analytics. */
  performanceBadge: "top" | "at_risk" | "low" | null;
};

export async function getLeadGenerationAgentPerformanceLeaderboard(): Promise<
  LeadGenerationAgentPerformanceRow[]
> {
  const supabase = await createClient();
  const agents = await getLeadGenerationAssignableAgents();
  if (agents.length === 0) {
    return [];
  }

  const t = lgTable(supabase, "lead_generation_assignments");
  const act = lgTable(supabase, "lead_generation_assignment_activities");

  const rows: LeadGenerationAgentPerformanceRow[] = [];

  for (const a of agents) {
    const [
      policy,
      freshRes,
      backlogRes,
      breachedRes,
      leadsRes,
      callsRes,
    ] = await Promise.all([
      getLeadGenerationDispatchPolicy(supabase, a.id),
      t
        .select("*", { count: "exact", head: true })
        .eq("agent_id", a.id)
        .eq("outcome", "pending")
        .in("assignment_status", [...ACTIVE])
        .eq("commercial_pipeline_status", "new"),
      t
        .select("*", { count: "exact", head: true })
        .eq("agent_id", a.id)
        .eq("outcome", "pending")
        .in("assignment_status", [...ACTIVE])
        .in("commercial_pipeline_status", ["contacted", "follow_up"]),
      t
        .select("*", { count: "exact", head: true })
        .eq("agent_id", a.id)
        .eq("outcome", "pending")
        .in("assignment_status", [...ACTIVE])
        .eq("sla_status", "breached"),
      t
        .select("*", { count: "exact", head: true })
        .eq("agent_id", a.id)
        .eq("outcome", "converted_to_lead"),
      act
        .select("*", { count: "exact", head: true })
        .eq("agent_id", a.id)
        .eq("activity_type", "call")
        .neq("activity_label", LG_CALL_STARTED_ACTIVITY_LABEL),
    ]);

    for (const r of [freshRes, backlogRes, breachedRes, leadsRes, callsRes]) {
      if (r.error) {
        throw new Error(`Leaderboard lead-gen : ${r.error.message}`);
      }
    }

    const freshStock = freshRes.count ?? 0;
    const pipelineBacklog = backlogRes.count ?? 0;
    const breachedSla = breachedRes.count ?? 0;
    const leadsConverted = leadsRes.count ?? 0;
    const callsLogged = callsRes.count ?? 0;

    const effectiveStockCap = policy.effectiveStockCap;

    let performanceBadge: LeadGenerationAgentPerformanceRow["performanceBadge"] = null;
    if (!policy.suspendInjection && policy.effectiveCapMultiplier >= 1.05) {
      performanceBadge = "top";
    } else if (policy.suspendInjection || breachedSla >= 8) {
      performanceBadge = "at_risk";
    } else if (policy.effectiveCapMultiplier <= 0.9) {
      performanceBadge = "low";
    }

    rows.push({
      agentId: a.id,
      displayName: a.displayName,
      email: a.email,
      freshStock,
      pipelineBacklog,
      breachedSla,
      leadsConverted,
      callsLogged,
      effectiveStockCap,
      suspendInjection: policy.suspendInjection,
      suspensionReason: policy.suspensionReason,
      performanceBadge,
    });
  }

  return rows.sort((x, y) => y.leadsConverted - x.leadsConverted || x.displayName.localeCompare(y.displayName, "fr"));
}
