import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationAssignmentActivityRow } from "../services/log-lead-generation-assignment-activity";
import { lgTable } from "../lib/lg-db";

export type LeadGenerationAssignmentActivityListItem = LeadGenerationAssignmentActivityRow & {
  agent_display_name: string;
};

async function enrichWithAgentNames(
  rows: LeadGenerationAssignmentActivityRow[],
): Promise<LeadGenerationAssignmentActivityListItem[]> {
  if (rows.length === 0) {
    return [];
  }
  const supabase = await createClient();
  const ids = [...new Set(rows.map((r) => r.agent_id))];
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids);

  if (error) {
    throw new Error(`Profils agents : ${error.message}`);
  }

  const map = new Map<string, string>();
  for (const p of profiles ?? []) {
    const row = p as { id: string; full_name: string | null; email: string | null };
    map.set(row.id, row.full_name?.trim() || row.email?.trim() || "Agent");
  }

  return rows.map((r) => ({
    ...r,
    agent_display_name: map.get(r.agent_id) ?? "Agent",
  }));
}

export type GetLeadGenerationAssignmentActivitiesOptions = {
  /** Limite le nombre de lignes (page « Ma file » : l’historique récent suffit). */
  limit?: number;
};

/**
 * Activités pour une assignation donnée (tri récent d’abord).
 */
export async function getLeadGenerationAssignmentActivities(
  assignmentId: string,
  options?: GetLeadGenerationAssignmentActivitiesOptions,
): Promise<LeadGenerationAssignmentActivityListItem[]> {
  const supabase = await createClient();
  const t = lgTable(supabase, "lead_generation_assignment_activities");

  let q = t.select("*").eq("assignment_id", assignmentId).order("created_at", { ascending: false });
  const cap = options?.limit;
  if (cap != null && cap > 0) {
    q = q.limit(cap);
  }

  const { data, error } = await q;

  if (error) {
    throw new Error(`Activités assignation : ${error.message}`);
  }

  const rows = (data ?? []) as LeadGenerationAssignmentActivityRow[];
  return enrichWithAgentNames(rows);
}

/**
 * Toutes les activités liées au stock (historique sur plusieurs assignations éventuelles).
 */
export async function getLeadGenerationStockActivities(
  stockId: string,
): Promise<LeadGenerationAssignmentActivityListItem[]> {
  const supabase = await createClient();
  const t = lgTable(supabase, "lead_generation_assignment_activities");

  const { data, error } = await t
    .select("*")
    .eq("stock_id", stockId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Activités stock : ${error.message}`);
  }

  const rows = (data ?? []) as LeadGenerationAssignmentActivityRow[];
  return enrichWithAgentNames(rows);
}
