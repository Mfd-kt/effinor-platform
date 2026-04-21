import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";
import { getLeadGenerationStockById } from "./get-lead-generation-stock-by-id";
import type { LeadGenerationStockDetail } from "./get-lead-generation-stock-by-id";

export type LeadGenerationAssignmentCallTrace = {
  last_call_status: string | null;
  last_call_at: string | null;
  last_call_note: string | null;
  last_call_recording_url: string | null;
};

export type LeadGenerationStockDetailForAgent = LeadGenerationStockDetail & {
  assignmentCallTrace: LeadGenerationAssignmentCallTrace;
  /** Chargée en contournement (impersonation + acteur direction / admin). */
  openedViaSupportBypass?: boolean;
  /** Titulaire de l’assignation courante (si connue). */
  currentAssignmentAgentId?: string | null;
  /**
   * Dernière assignation « refus / hors cible » de l’agent (fiche retirée de la file mais encore consultable).
   */
  lastTerminalAssignmentId?: string | null;
};

const emptyCallTrace: LeadGenerationAssignmentCallTrace = {
  last_call_status: null,
  last_call_at: null,
  last_call_note: null,
  last_call_recording_url: null,
};

/**
 * Charge le détail stock uniquement si l’assignation courante appartient à l’agent.
 */
export async function getLeadGenerationStockDetailForAgent(
  stockId: string,
  agentId: string,
): Promise<LeadGenerationStockDetailForAgent | null> {
  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const { data: st, error } = await stockTable
    .select("id, current_assignment_id")
    .eq("id", stockId)
    .maybeSingle();

  if (error) {
    throw new Error(`Stock : ${error.message}`);
  }
  if (!st) {
    return null;
  }

  const row = st as { id: string; current_assignment_id: string | null };

  const assignments = lgTable(supabase, "lead_generation_assignments");

  if (row.current_assignment_id) {
    const { data: asn } = await assignments
      .select(
        "agent_id, last_call_status, last_call_at, last_call_note, last_call_recording_url",
      )
      .eq("id", row.current_assignment_id)
      .maybeSingle();

    const a = asn as {
      agent_id: string;
      last_call_status: string | null;
      last_call_at: string | null;
      last_call_note: string | null;
      last_call_recording_url: string | null;
    } | null;
    if (!a || a.agent_id !== agentId) {
      return null;
    }

    const detail = await getLeadGenerationStockById(stockId);
    if (!detail) {
      return null;
    }
    if (detail.stock.qualification_status !== "qualified") {
      return null;
    }

    return {
      ...detail,
      assignmentCallTrace: {
        last_call_status: a.last_call_status ?? null,
        last_call_at: a.last_call_at ?? null,
        last_call_note: a.last_call_note ?? null,
        last_call_recording_url: a.last_call_recording_url ?? null,
      },
      openedViaSupportBypass: false,
      currentAssignmentAgentId: a.agent_id,
      lastTerminalAssignmentId: null,
    };
  }

  const { data: term } = await assignments
    .select(
      "id, agent_id, last_call_status, last_call_at, last_call_note, last_call_recording_url, consumed_at",
    )
    .eq("stock_id", stockId)
    .eq("agent_id", agentId)
    .eq("assignment_status", "consumed")
    .in("outcome", ["out_of_target", "cancelled"])
    .order("consumed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const t = term as {
    id: string;
    agent_id: string;
    last_call_status: string | null;
    last_call_at: string | null;
    last_call_note: string | null;
    last_call_recording_url: string | null;
  } | null;

  if (!t) {
    return null;
  }

  const detail = await getLeadGenerationStockById(stockId);
  if (!detail) {
    return null;
  }
  if (detail.stock.converted_lead_id) {
    return null;
  }

  return {
    ...detail,
    assignmentCallTrace: {
      last_call_status: t.last_call_status ?? null,
      last_call_at: t.last_call_at ?? null,
      last_call_note: t.last_call_note ?? null,
      last_call_recording_url: t.last_call_recording_url ?? null,
    },
    openedViaSupportBypass: false,
    currentAssignmentAgentId: null,
    lastTerminalAssignmentId: t.id,
  };
}

/**
 * Résout la fiche « Ma file » : d’abord comme agent, puis en vue support si l’acteur (compte réel)
 * impersonifie et a les droits direction / admin (l’assignation peut être celle d’un autre agent).
 */
export async function getLeadGenerationMyQueueStockPageDetail(
  stockId: string,
  agentUserId: string,
  allowSupportBypass: boolean,
): Promise<LeadGenerationStockDetailForAgent | null> {
  const asAgent = await getLeadGenerationStockDetailForAgent(stockId, agentUserId);
  if (asAgent) {
    return asAgent;
  }
  if (!allowSupportBypass) {
    return null;
  }

  const supabase = await createClient();
  const detail = await getLeadGenerationStockById(stockId);
  if (!detail) {
    return null;
  }
  if (detail.stock.converted_lead_id) {
    return null;
  }

  const assignmentId = detail.stock.current_assignment_id;
  if (!assignmentId) {
    const assignments = lgTable(supabase, "lead_generation_assignments");
    const { data: term } = await assignments
      .select(
        "id, agent_id, last_call_status, last_call_at, last_call_note, last_call_recording_url, consumed_at",
      )
      .eq("stock_id", stockId)
      .eq("agent_id", agentUserId)
      .eq("assignment_status", "consumed")
      .in("outcome", ["out_of_target", "cancelled"])
      .order("consumed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const t = term as {
      id: string;
      last_call_status: string | null;
      last_call_at: string | null;
      last_call_note: string | null;
      last_call_recording_url: string | null;
    } | null;

    return {
      ...detail,
      assignmentCallTrace: t
        ? {
            last_call_status: t.last_call_status ?? null,
            last_call_at: t.last_call_at ?? null,
            last_call_note: t.last_call_note ?? null,
            last_call_recording_url: t.last_call_recording_url ?? null,
          }
        : { ...emptyCallTrace },
      openedViaSupportBypass: true,
      currentAssignmentAgentId: null,
      lastTerminalAssignmentId: t?.id ?? null,
    };
  }

  const assignments = lgTable(supabase, "lead_generation_assignments");
  const { data: asn } = await assignments
    .select(
      "agent_id, last_call_status, last_call_at, last_call_note, last_call_recording_url",
    )
    .eq("id", assignmentId)
    .maybeSingle();

  const a = asn as {
    agent_id: string;
    last_call_status: string | null;
    last_call_at: string | null;
    last_call_note: string | null;
    last_call_recording_url: string | null;
  } | null;

  return {
    ...detail,
    assignmentCallTrace: {
      last_call_status: a?.last_call_status ?? null,
      last_call_at: a?.last_call_at ?? null,
      last_call_note: a?.last_call_note ?? null,
      last_call_recording_url: a?.last_call_recording_url ?? null,
    },
    openedViaSupportBypass: true,
    currentAssignmentAgentId: a?.agent_id ?? null,
    lastTerminalAssignmentId: null,
  };
}
