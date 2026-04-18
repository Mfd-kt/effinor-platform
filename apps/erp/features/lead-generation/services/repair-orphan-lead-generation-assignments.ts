import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

const ASSIGNMENT_ACTIVE_STATUSES = ["assigned", "opened", "in_progress"] as const;

export type RepairOrphanLeadGenerationAssignmentsSummary = {
  scanned: number;
  recycledAssignments: number;
  resetStocks: number;
};

/**
 * Corrige les fiches avec assignation courante orpheline (agent manquant / inactif / supprimé).
 * Borné pour rester sûr en exécution interactive.
 */
export async function repairOrphanLeadGenerationAssignments(input?: {
  limit?: number;
}): Promise<RepairOrphanLeadGenerationAssignmentsSummary> {
  const cap = Math.min(Math.max(1, input?.limit ?? 200), 500);
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const assignments = lgTable(supabase, "lead_generation_assignments");
  const nowIso = new Date().toISOString();
  let recycledAssignments = 0;
  let resetStocks = 0;

  const { data, error } = await stock
    .select(
      "id, stock_status, current_assignment_id, current_assignment:lead_generation_assignments!lead_generation_stock_current_assignment_id_fkey(id, assignment_status, outcome, created_lead_id, recycled_count, agent:profiles!lead_generation_assignments_agent_id_fkey(id, is_active, deleted_at))",
    )
    .in("stock_status", ["assigned", "in_progress", "ready"])
    .limit(cap);

  if (error) {
    throw new Error(`Contrôle assignations orphelines : ${error.message}`);
  }

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    stock_status: string;
    current_assignment_id: string | null;
    current_assignment:
      | {
          id: string;
          assignment_status: string;
          outcome: string;
          created_lead_id: string | null;
          recycled_count: number | null;
          agent: { id: string; is_active: boolean | null; deleted_at: string | null } | null;
        }
      | null;
  }>;

  for (const row of rows) {
    const assignment = row.current_assignment;
    const agent = assignment?.agent ?? null;
    const brokenAgentLink = !agent || agent.deleted_at !== null || agent.is_active === false;
    const orphaned =
      (row.stock_status === "assigned" || row.stock_status === "in_progress") &&
      (!assignment || brokenAgentLink);
    if (!orphaned) continue;

    if (
      assignment &&
      ASSIGNMENT_ACTIVE_STATUSES.includes(
        assignment.assignment_status as (typeof ASSIGNMENT_ACTIVE_STATUSES)[number],
      ) &&
      assignment.outcome === "pending" &&
      !assignment.created_lead_id
    ) {
      const { data: recycledRows } = await assignments
        .update({
          assignment_status: "recycled",
          recycle_status: "recycled",
          recycle_reason: "agent_disabled",
          recycled_count: (assignment.recycled_count ?? 0) + 1,
          recycled_at: nowIso,
          last_recycled_at: nowIso,
          last_activity_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", assignment.id)
        .in("assignment_status", [...ASSIGNMENT_ACTIVE_STATUSES])
        .eq("outcome", "pending")
        .select("id");
      recycledAssignments += (recycledRows ?? []).length;
    }

    const guardAssignmentId = row.current_assignment_id;
    let q = stock
      .update({
        current_assignment_id: null,
        stock_status: "ready",
        dispatch_queue_status: "review",
        dispatch_queue_reason: "agent_disabled",
        dispatch_queue_evaluated_at: null,
        updated_at: nowIso,
      })
      .eq("id", row.id);

    if (guardAssignmentId) {
      q = q.eq("current_assignment_id", guardAssignmentId);
    } else {
      q = q.is("current_assignment_id", null);
    }
    const { data: resetRows } = await q.select("id");
    resetStocks += (resetRows ?? []).length;
  }

  return { scanned: rows.length, recycledAssignments, resetStocks };
}
