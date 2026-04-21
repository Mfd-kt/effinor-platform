import { createClient } from "@/lib/supabase/server";

import type { CommercialPipelineStatus } from "../domain/commercial-pipeline-status";
import type { CommercialSlaStatus } from "../domain/commercial-pipeline-sla";
import type { LeadGenerationCommercialPriority, LeadGenerationDispatchQueueStatus } from "../domain/statuses";
import { rowCountsTowardCommercialCapacityVolume } from "../lib/agent-commercial-capacity";
import { formatMyQueueCeeSheetOptionLabel } from "../lib/my-queue-cee-sheet-option";
import { lgTable } from "../lib/lg-db";
import { sortQueueItems } from "../lib/my-queue-follow-up";

export type MyLeadGenerationQueueItem = {
  assignmentId: string;
  stockId: string;
  /** Fiche CEE du lot d’import (si renseignée). */
  ceeSheetId: string | null;
  /** Libellé affichable (nom / code). */
  ceeSheetDisplay: string | null;
  companyName: string;
  phone: string | null;
  email: string | null;
  enrichedEmail: string | null;
  /** E-mail affiché (fiche ou suggestion enrichie). */
  displayEmail: string | null;
  decisionMakerName: string | null;
  decisionMakerRole: string | null;
  city: string | null;
  category: string | null;
  commercialScore: number;
  commercialPriority: LeadGenerationCommercialPriority;
  dispatchQueueStatus: LeadGenerationDispatchQueueStatus;
  dispatchQueueReason: string | null;
  lastActivityAt: string | null;
  assignedAt: string;
  attemptCount: number;
  /** Prochaine relance future la plus proche (activités). */
  nearestNextActionAt: string | null;
  /** Au moins une relance prévue est dépassée. */
  hasOverdueFollowUp: boolean;
  /** Plus ancienne relance dépassée (tri des retards). */
  earliestOverdueAt: string | null;
  /** Pipeline commercial (seul `new` compte pour le stock neuf / plafond). */
  commercialPipelineStatus: CommercialPipelineStatus;
  slaDueAt: string | null;
  slaStatus: CommercialSlaStatus | null;
};

/**
 * File opérationnelle de l’agent connecté : assignations actives rattachées au stock courant.
 */
export async function getMyLeadGenerationQueue(agentId: string): Promise<MyLeadGenerationQueueItem[]> {
  const supabase = await createClient();
  const assignments = lgTable(supabase, "lead_generation_assignments");

  const { data: rows, error } = await assignments
    .select(
      `
      id,
      assigned_at,
      last_activity_at,
      attempt_count,
      commercial_pipeline_status,
      sla_due_at,
      sla_status,
      stock:lead_generation_stock!lead_generation_assignments_stock_id_fkey (
        id,
        company_name,
        phone,
        email,
        city,
        category,
        commercial_score,
        commercial_priority,
        qualification_status,
        dispatch_queue_status,
        dispatch_queue_reason,
        stock_status,
        converted_lead_id,
        current_assignment_id,
        duplicate_of_stock_id,
        enriched_email,
        normalized_phone,
        decision_maker_name,
        decision_maker_role,
        import_batch:lead_generation_import_batches!lead_generation_stock_import_batch_id_fkey (
          cee_sheet_id,
          cee_sheet_code,
          cee_sheet:cee_sheets!lead_generation_import_batches_cee_sheet_id_fkey (
            id,
            code,
            label
          )
        )
      )
    `,
    )
    .eq("agent_id", agentId)
    .in("assignment_status", ["assigned", "opened", "in_progress"])
    .eq("outcome", "pending");

  if (error) {
    throw new Error(`Ma file lead generation : ${error.message}`);
  }

  type CeeSheetRow = {
    id: string;
    code: string | null;
    label: string | null;
  };

  type ImportBatchRow = {
    cee_sheet_id: string | null;
    cee_sheet_code: string | null;
    cee_sheet: CeeSheetRow | CeeSheetRow[] | null;
  };

  type StockRow = {
    id: string;
    company_name: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    category: string | null;
    commercial_score: number;
    commercial_priority: string;
    qualification_status: string;
    dispatch_queue_status: string;
    dispatch_queue_reason: string | null;
    stock_status: string;
    converted_lead_id: string | null;
    current_assignment_id: string | null;
    duplicate_of_stock_id: string | null;
    enriched_email: string | null;
    normalized_phone: string | null;
    decision_maker_name: string | null;
    decision_maker_role: string | null;
    import_batch: ImportBatchRow | ImportBatchRow[] | null;
  };

  type Row = {
    id: string;
    assigned_at: string;
    last_activity_at: string | null;
    attempt_count: number;
    commercial_pipeline_status: string | null;
    sla_due_at: string | null;
    sla_status: string | null;
    stock: StockRow | StockRow[] | null;
  };

  function pickStock(s: Row["stock"]): StockRow | null {
    if (!s) {
      return null;
    }
    return Array.isArray(s) ? s[0] ?? null : s;
  }

  function pickBatch(b: StockRow["import_batch"]): ImportBatchRow | null {
    if (!b) {
      return null;
    }
    return Array.isArray(b) ? b[0] ?? null : b;
  }

  function pickCeeSheet(sh: ImportBatchRow["cee_sheet"]): CeeSheetRow | null {
    if (!sh) {
      return null;
    }
    return Array.isArray(sh) ? sh[0] ?? null : sh;
  }

  function resolveCeeFields(s: StockRow): { ceeSheetId: string | null; ceeSheetDisplay: string | null } {
    const batch = pickBatch(s.import_batch);
    const sheet = pickCeeSheet(batch?.cee_sheet ?? null);
    const idFromBatch = batch?.cee_sheet_id?.trim() || null;

    if (sheet) {
      const sid = String(sheet.id);
      return {
        ceeSheetId: sid,
        ceeSheetDisplay: formatMyQueueCeeSheetOptionLabel({
          id: sid,
          code: sheet.code?.trim() ?? "",
          label: sheet.label?.trim() ?? "",
        }),
      };
    }
    const codeOnly = batch?.cee_sheet_code?.trim() || null;
    if (codeOnly) {
      return { ceeSheetId: idFromBatch, ceeSheetDisplay: codeOnly };
    }
    return { ceeSheetId: idFromBatch, ceeSheetDisplay: null };
  }

  const raw = (rows ?? []) as Row[];

  /** Même périmètre que {@link computeAgentCommercialCapacity} (volume agent). */
  const active = raw.filter((r) =>
    rowCountsTowardCommercialCapacityVolume({
      commercial_pipeline_status: r.commercial_pipeline_status,
      stock: pickStock(r.stock),
    }),
  );

  const assignmentIds = active.map((r) => r.id);
  let nextByAssignment = new Map<string, NextActionHint>();
  try {
    nextByAssignment = await loadNextActionHints(assignmentIds);
  } catch {
    // Hardening: keep the queue usable even if follow-up hints fail.
    nextByAssignment = new Map<string, NextActionHint>();
  }

  const items: MyLeadGenerationQueueItem[] = active.map((r) => {
    const s = pickStock(r.stock)!;
    const { ceeSheetId, ceeSheetDisplay } = resolveCeeFields(s);
    const hint = nextByAssignment.get(r.id) ?? { nearest: null, overdue: false, earliestOverdueAt: null };
    const emailPrimary = s.email?.trim() || null;
    const enriched = s.enriched_email?.trim() || null;
    const displayEmail = emailPrimary ?? enriched ?? null;
    return {
      assignmentId: r.id,
      stockId: s.id,
      ceeSheetId,
      ceeSheetDisplay,
      commercialPipelineStatus: (r.commercial_pipeline_status ?? "new") as CommercialPipelineStatus,
      slaDueAt: r.sla_due_at,
      slaStatus: (r.sla_status ?? null) as CommercialSlaStatus | null,
      companyName: s.company_name,
      phone: s.phone ?? s.normalized_phone ?? null,
      email: s.email,
      enrichedEmail: s.enriched_email,
      displayEmail,
      decisionMakerName: s.decision_maker_name?.trim() || null,
      decisionMakerRole: s.decision_maker_role?.trim() || null,
      city: s.city,
      category: s.category,
      commercialScore: s.commercial_score ?? 0,
      commercialPriority: (s.commercial_priority ?? "normal") as LeadGenerationCommercialPriority,
      dispatchQueueStatus: (s.dispatch_queue_status ?? "review") as LeadGenerationDispatchQueueStatus,
      dispatchQueueReason: s.dispatch_queue_reason,
      lastActivityAt: r.last_activity_at,
      assignedAt: r.assigned_at,
      attemptCount: r.attempt_count ?? 0,
      nearestNextActionAt: hint.nearest,
      hasOverdueFollowUp: hint.overdue,
      earliestOverdueAt: hint.earliestOverdueAt,
    };
  });

  return sortQueueItems(items);
}

type NextActionHint = {
  nearest: string | null;
  overdue: boolean;
  earliestOverdueAt: string | null;
};

async function loadNextActionHints(assignmentIds: string[]): Promise<Map<string, NextActionHint>> {
  const map = new Map<string, NextActionHint>();
  if (assignmentIds.length === 0) {
    return map;
  }
  const supabase = await createClient();
  const t = lgTable(supabase, "lead_generation_assignment_activities");
  const { data, error } = await t
    .select("assignment_id, next_action_at")
    .in("assignment_id", assignmentIds)
    .not("next_action_at", "is", null);

  if (error) {
    throw new Error(`Relances activités : ${error.message}`);
  }

  const now = Date.now();
  for (const id of assignmentIds) {
    map.set(id, { nearest: null, overdue: false, earliestOverdueAt: null });
  }

  for (const row of data ?? []) {
    const r = row as { assignment_id: string; next_action_at: string };
    const tMs = new Date(r.next_action_at).getTime();
    const cur = map.get(r.assignment_id);
    if (!cur) {
      continue;
    }
    if (tMs < now) {
      cur.overdue = true;
      if (!cur.earliestOverdueAt || tMs < new Date(cur.earliestOverdueAt).getTime()) {
        cur.earliestOverdueAt = r.next_action_at;
      }
    } else {
      if (!cur.nearest || tMs < new Date(cur.nearest).getTime()) {
        cur.nearest = r.next_action_at;
      }
    }
    map.set(r.assignment_id, cur);
  }

  return map;
}
