import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

export type LgcToCrmConversionRow = {
  id: string;
  companyName: string;
  createdAt: string;
};

/**
 * Fiches `leads` créées par l’agent et issues d’une fiche lead gen (stock) :
 * `lead_generation_stock_id` renseigné. Fenêtre [startIso, endIso) sur `created_at`.
 */
export async function getAgentLgcToCrmConversions(
  supabase: SupabaseClient<Database>,
  agentId: string,
  startIso: string,
  endIso: string,
  options?: { recentLimit?: number },
): Promise<{ countInRange: number; recent: LgcToCrmConversionRow[] }> {
  const limit = options?.recentLimit ?? 10;

  const [countRes, listRes] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("created_by_agent_id", agentId)
      .not("lead_generation_stock_id", "is", null)
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("leads")
      .select("id, company_name, created_at")
      .is("deleted_at", null)
      .eq("created_by_agent_id", agentId)
      .not("lead_generation_stock_id", "is", null)
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (countRes.error) {
    throw new Error(countRes.error.message);
  }
  if (listRes.error) {
    throw new Error(listRes.error.message);
  }

  const rows = (listRes.data ?? []) as Array<{
    id: string;
    company_name: string | null;
    created_at: string;
  }>;

  return {
    countInRange: countRes.count ?? 0,
    recent: rows.map((r) => ({
      id: r.id,
      companyName: r.company_name?.trim() || "—",
      createdAt: r.created_at,
    })),
  };
}
