import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationAssignmentRecycleStatus } from "../domain/recycle-eligibility";
import { lgTable } from "../lib/lg-db";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";

import {
  computeLeadGenerationRecycleEligibility,
  isAssignmentTerminalForRecycle,
  isStockTerminalForRecycle,
  type AssignmentSnapshotForRecycle,
} from "./compute-recycle-eligibility";

export type EvaluateRecycleStatusResult = {
  assignmentId: string;
  recycleStatus: LeadGenerationAssignmentRecycleStatus;
  recycleReason: string | null;
  recycleEligibleAt: string | null;
};

export type EvaluateRecycleBatchSummary = {
  totalRequested: number;
  totalSucceeded: number;
  totalFailed: number;
  failedAssignmentIds: string[];
};

const BATCH_MAX = 100;

type AssignmentRow = {
  id: string;
  stock_id: string;
  assignment_status: string;
  outcome: string;
  created_lead_id: string | null;
  assigned_at: string;
  opened_at: string | null;
  last_activity_at: string | null;
  attempt_count: number;
  recycle_status: string;
  recycle_reason: string | null;
  recycle_eligible_at: string | null;
};

async function loadStockForRecycle(stockId: string) {
  const client = await createClient();
  const stock = lgTable(client, "lead_generation_stock");
  const { data, error } = await stock
    .select("id, stock_status, converted_lead_id, current_assignment_id")
    .eq("id", stockId)
    .maybeSingle();
  if (error) {
    throw new Error(`Stock : ${error.message}`);
  }
  return data as {
    id: string;
    stock_status: string;
    converted_lead_id: string | null;
    current_assignment_id: string | null;
  } | null;
}

/** Activités utiles au calcul (relances). */
async function loadActivityTouchesForAssignment(assignmentId: string): Promise<{ next_action_at: string | null }[]> {
  const supabase = await createClient();
  const t = lgTable(supabase, "lead_generation_assignment_activities");
  const { data, error } = await t.select("next_action_at").eq("assignment_id", assignmentId);
  if (error) {
    throw new Error(`Activités : ${error.message}`);
  }
  return (data ?? []) as { next_action_at: string | null }[];
}

/**
 * Évalue et persiste le statut de recyclage pour une assignation.
 */
export async function evaluateLeadGenerationAssignmentRecycleStatus(input: {
  assignmentId: string;
}): Promise<EvaluateRecycleStatusResult> {
  const supabase = await createClient();
  const assignments = lgTable(supabase, "lead_generation_assignments");

  const { data: row, error } = await assignments.select("*").eq("id", input.assignmentId).maybeSingle();
  if (error) {
    throw new Error(`Assignation : ${error.message}`);
  }
  if (!row) {
    throw new Error("Assignation introuvable.");
  }

  const a = row as AssignmentRow;

  if (a.recycle_status === "recycled" || a.recycle_status === "closed") {
    return snapshot(a);
  }

  const stock = await loadStockForRecycle(a.stock_id);
  if (!stock) {
    throw new Error("Stock associé introuvable.");
  }

  const snap: AssignmentSnapshotForRecycle = {
    assignment_status: a.assignment_status,
    outcome: a.outcome,
    created_lead_id: a.created_lead_id,
    assigned_at: a.assigned_at,
    opened_at: a.opened_at,
    last_activity_at: a.last_activity_at,
    attempt_count: a.attempt_count,
  };

  if (isStockTerminalForRecycle(stock.stock_status, stock.converted_lead_id) || isAssignmentTerminalForRecycle(snap)) {
    const { error: uErr } = await assignments
      .update({
        recycle_status: "closed",
        recycle_reason: null,
        recycle_eligible_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", a.id);
    if (uErr) {
      throw new Error(`Mise à jour recyclage (clos) : ${uErr.message}`);
    }
    return {
      assignmentId: a.id,
      recycleStatus: "closed",
      recycleReason: null,
      recycleEligibleAt: null,
    };
  }

  const touches = await loadActivityTouchesForAssignment(a.id);
  const { settings } = await getLeadGenerationSettings();
  const computed = computeLeadGenerationRecycleEligibility({
    assignment: snap,
    stockStatus: stock.stock_status,
    stockConvertedLeadId: stock.converted_lead_id,
    activities: touches,
    rules: settings.recyclingRules,
  });

  const nowIso = new Date().toISOString();
  if (computed.isEligible) {
    const { error: uErr } = await assignments
      .update({
        recycle_status: "eligible",
        recycle_reason: computed.recycleReason,
        recycle_eligible_at: computed.recycleEligibleAt ?? nowIso,
        updated_at: nowIso,
      })
      .eq("id", a.id);
    if (uErr) {
      throw new Error(`Mise à jour recyclage (éligible) : ${uErr.message}`);
    }
    return {
      assignmentId: a.id,
      recycleStatus: "eligible",
      recycleReason: computed.recycleReason,
      recycleEligibleAt: computed.recycleEligibleAt ?? nowIso,
    };
  }

  const { error: uErr } = await assignments
    .update({
      recycle_status: "active",
      recycle_reason: null,
      recycle_eligible_at: null,
      updated_at: nowIso,
    })
    .eq("id", a.id);
  if (uErr) {
    throw new Error(`Mise à jour recyclage (actif) : ${uErr.message}`);
  }

  return {
    assignmentId: a.id,
    recycleStatus: "active",
    recycleReason: null,
    recycleEligibleAt: null,
  };
}

function snapshot(a: AssignmentRow): EvaluateRecycleStatusResult {
  return {
    assignmentId: a.id,
    recycleStatus: a.recycle_status as LeadGenerationAssignmentRecycleStatus,
    recycleReason: a.recycle_reason,
    recycleEligibleAt: a.recycle_eligible_at,
  };
}

export async function evaluateLeadGenerationAssignmentRecycleStatusBatch(
  assignmentIds: string[],
): Promise<EvaluateRecycleBatchSummary> {
  const capped = assignmentIds.slice(0, BATCH_MAX);
  const failedAssignmentIds: string[] = [];
  let totalSucceeded = 0;

  for (const id of capped) {
    try {
      await evaluateLeadGenerationAssignmentRecycleStatus({ assignmentId: id });
      totalSucceeded += 1;
    } catch {
      failedAssignmentIds.push(id);
    }
  }

  return {
    totalRequested: capped.length,
    totalSucceeded,
    totalFailed: failedAssignmentIds.length,
    failedAssignmentIds,
  };
}

/**
 * Passe en revue des assignations encore « en cours » (borné, action manuelle).
 */
export async function evaluateActiveLeadGenerationAssignmentRecycleStatusQuick(input: {
  limit: number;
}): Promise<EvaluateRecycleBatchSummary> {
  const cap = Math.min(Math.max(1, input.limit), 100);
  const supabase = await createClient();
  const assignments = lgTable(supabase, "lead_generation_assignments");

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
    return { totalRequested: 0, totalSucceeded: 0, totalFailed: 0, failedAssignmentIds: [] };
  }

  return evaluateLeadGenerationAssignmentRecycleStatusBatch(ids);
}
