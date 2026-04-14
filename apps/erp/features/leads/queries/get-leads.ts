import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { getLeadIdsForAccess } from "@/lib/auth/data-scope";

import type { LeadRow } from "@/features/leads/types";

export async function getLeads(access?: AccessContext): Promise<LeadRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (access?.kind === "authenticated") {
    const leadIds = await getLeadIdsForAccess(supabase, access);
    if (leadIds !== "all") {
      if (leadIds.length === 0) {
        return [];
      }
      query = query.in("id", leadIds);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible de charger les leads : ${error.message}`);
  }

  return (data ?? []) as LeadRow[];
}
