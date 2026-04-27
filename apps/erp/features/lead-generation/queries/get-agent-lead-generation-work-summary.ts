import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import { lgTable } from "../lib/lg-db";
import { getMyLeadGenerationQueue } from "./get-my-lead-generation-queue";

export type LeadGenWorkActivityRow = {
  id: string;
  createdAt: string;
  activityType: string;
  activityLabel: string;
  activityNotes: string | null;
  stockId: string;
  companyName: string;
};

export type AgentLeadGenWorkSummary = {
  /** Fiches actuellement en file opérationnelle (même logique que « Ma file »). */
  fichesInQueue: number;
  /** Lignes d’activité enregistrées sur l’intervalle (appels, mails, notes…). */
  activitiesInRange: number;
  /** Sous-ensemble : type `call`. */
  callsInRange: number;
  /** Dernières lignes pour l’historique affiché. */
  recent: LeadGenWorkActivityRow[];
};

/**
 * Synthèse travail LGC sur [startIso, endIso) pour un agent (prospection stock avant conversion CRM).
 */
export async function getAgentLeadGenWorkSummary(
  supabase: SupabaseClient<Database>,
  agentId: string,
  startIso: string,
  endIso: string,
  options?: { queueItems?: Awaited<ReturnType<typeof getMyLeadGenerationQueue>> },
): Promise<AgentLeadGenWorkSummary> {
  const queueItems = options?.queueItems ?? (await getMyLeadGenerationQueue(agentId));
  const fichesInQueue = queueItems.length;

  const activitiesT = lgTable(supabase, "lead_generation_assignment_activities");

  const [countAll, countCalls, recentRaw] = await Promise.all([
    activitiesT
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    activitiesT
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("activity_type", "call")
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    activitiesT
      .select("id, created_at, activity_type, activity_label, activity_notes, stock_id")
      .eq("agent_id", agentId)
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (countAll.error) {
    throw new Error(`Activités LGC (compte) : ${countAll.error.message}`);
  }
  if (countCalls.error) {
    throw new Error(`Activités LGC (appels) : ${countCalls.error.message}`);
  }
  if (recentRaw.error) {
    throw new Error(`Activités LGC (liste) : ${recentRaw.error.message}`);
  }

  const rows = (recentRaw.data ?? []) as Array<{
    id: string;
    created_at: string;
    activity_type: string;
    activity_label: string;
    activity_notes: string | null;
    stock_id: string;
  }>;

  const stockIds = [...new Set(rows.map((r) => r.stock_id))];
  let nameByStock = new Map<string, string>();
  if (stockIds.length > 0) {
    const stock = lgTable(supabase, "lead_generation_stock");
    const { data: stocks, error: sErr } = await stock.select("id, company_name").in("id", stockIds);
    if (sErr) {
      throw new Error(`Stock LGC (noms) : ${sErr.message}`);
    }
    for (const s of stocks ?? []) {
      const row = s as { id: string; company_name: string };
      nameByStock.set(row.id, row.company_name?.trim() || "—");
    }
  }

  const recent: LeadGenWorkActivityRow[] = rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    activityType: r.activity_type,
    activityLabel: r.activity_label,
    activityNotes: r.activity_notes,
    stockId: r.stock_id,
    companyName: nameByStock.get(r.stock_id) ?? "—",
  }));

  return {
    fichesInQueue,
    activitiesInRange: countAll.count ?? 0,
    callsInRange: countCalls.count ?? 0,
    recent,
  };
}
