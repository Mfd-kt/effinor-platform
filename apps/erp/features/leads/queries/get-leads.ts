import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { getLeadIdsForAccess } from "@/lib/auth/data-scope";

import type { LeadListRow } from "@/features/leads/types";

export type LeadListVisibility = "active" | "lost_only";

/* `*` inclut `lead_type` (migration 2.1) ; pas de jointure extensions (éviter N+1 sur la liste). */
const LEADS_LIST_SELECT = `
  *,
  cee_sheet:cee_sheets!cee_sheet_id(code, label, simulator_key, workflow_key)
`;

export async function getLeads(
  access?: AccessContext,
  opts?: { visibility?: LeadListVisibility },
): Promise<LeadListRow[]> {
  const supabase = await createClient();
  const visibility = opts?.visibility ?? "active";

  let query = supabase
    .from("leads")
    .select(LEADS_LIST_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (visibility === "active") {
    query = query.neq("lead_status", "lost");
  } else {
    query = query.eq("lead_status", "lost");
  }

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

  /* Types DB : `leads.Relationships` ne liste pas encore `cee_sheet_id` → cee_sheets ; la jointure est valide côté API. */
  const rows = (data ?? []) as unknown as Array<
    LeadListRow & { cee_sheet?: LeadListRow["cee_sheet"] | null }
  >;
  return rows.map((r) => ({ ...r, cee_sheet: r.cee_sheet ?? null }));
}
