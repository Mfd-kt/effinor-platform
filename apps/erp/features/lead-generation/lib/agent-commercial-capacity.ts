import type { SupabaseClient } from "@supabase/supabase-js";

import { lgTable } from "./lg-db";

/** FK PostgREST : `assignments.stock_id` → `lead_generation_stock` (évite l’ambiguïté avec `stock.current_assignment_id`). */
export const LEAD_GENERATION_ASSIGNMENTS_STOCK_ID_FKEY = "lead_generation_assignments_stock_id_fkey";

/** Seuil affichage / ralentissement dispatch (orange). */
export const COMMERCIAL_CAPACITY_WARNING_THRESHOLD = 100;
/** Plafond dur : plus d’attribution automatique ni manuelle. */
export const COMMERCIAL_CAPACITY_BLOCK_THRESHOLD = 120;

/** Max de nouvelles attributions par passe quand l’agent est déjà en zone warning. */
export const COMMERCIAL_CAPACITY_WARNING_MAX_DISPATCH_PER_RUN = 5;

export const AGENT_COMMERCIAL_CAPACITY_BLOCKED_MESSAGE =
  "Agent à capacité maximale, attribution impossible.";

export type AgentCommercialCapacityLevel = "normal" | "warning" | "blocked";

export type AgentCommercialCapacitySnapshot = {
  stockNeuf: number;
  suivi: number;
  total: number;
  level: AgentCommercialCapacityLevel;
};

/** Chargement capacité pour l’UI : pas de chiffres factices si la requête échoue. */
export type AgentCommercialCapacityViewModel =
  | { ok: true; snapshot: AgentCommercialCapacitySnapshot }
  | { ok: false };

function resolveLevel(total: number): AgentCommercialCapacityLevel {
  if (total >= COMMERCIAL_CAPACITY_BLOCK_THRESHOLD) {
    return "blocked";
  }
  if (total >= COMMERCIAL_CAPACITY_WARNING_THRESHOLD) {
    return "warning";
  }
  return "normal";
}

type AssignmentRow = {
  commercial_pipeline_status: string | null;
  stock: { converted_lead_id: string | null; stock_status: string | null } | { converted_lead_id: string | null; stock_status: string | null }[] | null;
};

function pickStock(s: AssignmentRow["stock"]): { converted_lead_id: string | null; stock_status: string | null } | null {
  if (!s) {
    return null;
  }
  const row = Array.isArray(s) ? s[0] : s;
  return row ?? null;
}

/**
 * Périmètre strict du volume capacité agent (aligné comptage cockpit / dispatch).
 * Réutilisé par la file « Ma file » pour filtrer les lignes et les KPI.
 */
export function rowCountsTowardCommercialCapacityVolume(row: AssignmentRow): boolean {
  const st = pickStock(row.stock);
  if (!st) {
    return false;
  }
  if (st.converted_lead_id != null) {
    return false;
  }
  const ss = (st.stock_status ?? "").trim();
  if (ss === "rejected" || ss === "archived" || ss === "expired") {
    return false;
  }
  const ps = (row.commercial_pipeline_status ?? "").trim();
  if (ps === "converted") {
    return false;
  }
  return ps === "new" || ps === "contacted" || ps === "follow_up";
}

function accumulateRow(row: AssignmentRow, acc: { stockNeuf: number; suivi: number }) {
  if (!rowCountsTowardCommercialCapacityVolume(row)) {
    return;
  }
  const ps = (row.commercial_pipeline_status ?? "").trim();
  if (ps === "new") {
    acc.stockNeuf += 1;
  } else if (ps === "contacted" || ps === "follow_up") {
    acc.suivi += 1;
  }
}

/**
 * Volume opérationnel agent : stock neuf (pipeline `new`) + suivi (`contacted`, `follow_up`),
 * en excluant les fiches converties, rejetées / archivées / expirées côté stock.
 */
export async function computeAgentCommercialCapacity(
  supabase: SupabaseClient,
  agentId: string,
): Promise<AgentCommercialCapacitySnapshot> {
  const t = lgTable(supabase, "lead_generation_assignments");
  const { data, error } = await t
    .select(
      `commercial_pipeline_status, stock:lead_generation_stock!${LEAD_GENERATION_ASSIGNMENTS_STOCK_ID_FKEY}!inner(converted_lead_id, stock_status)`,
    )
    .eq("agent_id", agentId)
    .eq("outcome", "pending")
    .in("assignment_status", ["assigned", "opened", "in_progress"]);

  if (error) {
    throw new Error(`Capacité commerciale agent : ${error.message}`);
  }

  const acc = { stockNeuf: 0, suivi: 0 };
  for (const r of (data ?? []) as AssignmentRow[]) {
    accumulateRow(r, acc);
  }
  const total = acc.stockNeuf + acc.suivi;
  return {
    stockNeuf: acc.stockNeuf,
    suivi: acc.suivi,
    total,
    level: resolveLevel(total),
  };
}

/**
 * Même logique que {@link computeAgentCommercialCapacity} pour plusieurs agents (une requête).
 */
export async function computeCommercialCapacityForAgents(
  supabase: SupabaseClient,
  agentIds: string[],
): Promise<Map<string, AgentCommercialCapacitySnapshot>> {
  const map = new Map<string, AgentCommercialCapacitySnapshot>();
  if (agentIds.length === 0) {
    return map;
  }
  const uniq = [...new Set(agentIds)];
  const t = lgTable(supabase, "lead_generation_assignments");
  const { data, error } = await t
    .select(
      `agent_id, commercial_pipeline_status, stock:lead_generation_stock!${LEAD_GENERATION_ASSIGNMENTS_STOCK_ID_FKEY}!inner(converted_lead_id, stock_status)`,
    )
    .in("agent_id", uniq)
    .eq("outcome", "pending")
    .in("assignment_status", ["assigned", "opened", "in_progress"]);

  if (error) {
    throw new Error(`Capacité commerciale (lot) : ${error.message}`);
  }

  const accByAgent = new Map<string, { stockNeuf: number; suivi: number }>();
  for (const id of uniq) {
    accByAgent.set(id, { stockNeuf: 0, suivi: 0 });
  }

  for (const r of (data ?? []) as (AssignmentRow & { agent_id: string })[]) {
    const bucket = accByAgent.get(r.agent_id);
    if (!bucket) {
      continue;
    }
    accumulateRow(r, bucket);
  }

  for (const id of uniq) {
    const acc = accByAgent.get(id) ?? { stockNeuf: 0, suivi: 0 };
    const total = acc.stockNeuf + acc.suivi;
    map.set(id, {
      stockNeuf: acc.stockNeuf,
      suivi: acc.suivi,
      total,
      level: resolveLevel(total),
    });
  }
  return map;
}

/**
 * Réduit le « besoin » de dispatch (nouvelles fiches) selon le volume total et les seuils 100 / 120.
 */
export function applyCommercialCapacityToDispatchNeed(baseNeed: number, volumeTotal: number): number {
  if (baseNeed <= 0) {
    return 0;
  }
  if (volumeTotal >= COMMERCIAL_CAPACITY_BLOCK_THRESHOLD) {
    return 0;
  }
  const headroomToBlock = COMMERCIAL_CAPACITY_BLOCK_THRESHOLD - volumeTotal;
  let n = Math.min(baseNeed, headroomToBlock);
  if (volumeTotal >= COMMERCIAL_CAPACITY_WARNING_THRESHOLD) {
    n = Math.min(n, COMMERCIAL_CAPACITY_WARNING_MAX_DISPATCH_PER_RUN);
  }
  return Math.max(0, Math.floor(n));
}
