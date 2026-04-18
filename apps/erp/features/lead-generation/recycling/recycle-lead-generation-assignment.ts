import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

import { isStockTerminalForRecycle } from "./compute-recycle-eligibility";

export type RecycleLeadGenerationAssignmentResult = {
  assignmentId: string;
  stockId: string;
  recycledCount: number;
};

/**
 * Recycle effectif : retirer l’assignation du circuit actif et remettre le stock en « prêt » si cohérent.
 * Conservateur : refuse si non éligible, stock converti / rejeté, ou lien assignment / stock incohérent.
 */
export async function recycleLeadGenerationAssignment(input: {
  assignmentId: string;
}): Promise<RecycleLeadGenerationAssignmentResult> {
  const supabase = await createClient();
  const assignments = lgTable(supabase, "lead_generation_assignments");
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const { data: a, error: aErr } = await assignments.select("*").eq("id", input.assignmentId).maybeSingle();
  if (aErr) {
    throw new Error(`Assignation : ${aErr.message}`);
  }
  if (!a) {
    throw new Error("Assignation introuvable.");
  }

  const assignment = a as {
    id: string;
    stock_id: string;
    recycle_status: string;
    created_lead_id: string | null;
    recycled_count: number;
  };

  if (assignment.recycle_status !== "eligible") {
    throw new Error("Seules les assignations marquées « éligibles » au recyclage peuvent être recyclées.");
  }
  if (assignment.created_lead_id) {
    throw new Error("Cette assignation est liée à un lead : recyclage refusé.");
  }

  const { data: stock, error: sErr } = await stockTable
    .select("id, stock_status, converted_lead_id, current_assignment_id")
    .eq("id", assignment.stock_id)
    .maybeSingle();

  if (sErr) {
    throw new Error(`Stock : ${sErr.message}`);
  }
  if (!stock) {
    throw new Error("Stock introuvable.");
  }

  const st = stock as {
    id: string;
    stock_status: string;
    converted_lead_id: string | null;
    current_assignment_id: string | null;
  };

  if (isStockTerminalForRecycle(st.stock_status, st.converted_lead_id)) {
    throw new Error("Le stock est dans un état terminal : recyclage refusé.");
  }

  if (st.current_assignment_id && st.current_assignment_id !== assignment.id) {
    throw new Error("L’attribution courante du stock ne correspond pas à cette assignation.");
  }

  const nowIso = new Date().toISOString();
  const nextCount = (assignment.recycled_count ?? 0) + 1;

  const { data: assRows, error: assErr } = await assignments
    .update({
      assignment_status: "recycled",
      recycle_status: "recycled",
      recycled_count: nextCount,
      last_recycled_at: nowIso,
      recycled_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", assignment.id)
    .eq("recycle_status", "eligible")
    .select("id");

  if (assErr) {
    throw new Error(`Mise à jour assignation : ${assErr.message}`);
  }
  if (!assRows?.length) {
    throw new Error("L’assignation n’était plus éligible au recyclage.");
  }

  const { data: stockRows, error: stockErr } = await stockTable
    .update({
      stock_status: "ready",
      current_assignment_id: null,
      updated_at: nowIso,
    })
    .eq("id", st.id)
    .eq("current_assignment_id", assignment.id)
    .select("id");

  if (stockErr) {
    throw new Error(`Mise à jour stock : ${stockErr.message}`);
  }
  if (!stockRows?.length) {
    throw new Error("Impossible de libérer le stock (état déjà modifié).");
  }

  return {
    assignmentId: assignment.id,
    stockId: st.id,
    recycledCount: nextCount,
  };
}
