import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { canAccessLeadForCeeTeamManager } from "@/lib/auth/switch-cee-sheet-eligibility";

import type { LeadDetailRow } from "@/features/leads/types";

export async function getLeadById(id: string, access?: AccessContext): Promise<LeadDetailRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(
      `
      *,
      cee_sheet:cee_sheets!cee_sheet_id (
        id,
        code,
        label,
        simulator_key,
        workflow_key
      ),
      created_by_agent:profiles!created_by_agent_id (
        id,
        full_name,
        email,
        avatar_url
      ),
      confirmed_by:profiles!confirmed_by_user_id (
        id,
        full_name,
        email,
        avatar_url
      )
    `,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de charger le lead : ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const raw = data as unknown as LeadDetailRow & { cee_sheet?: LeadDetailRow["cee_sheet"] | null };
  const row: LeadDetailRow = { ...raw, cee_sheet: raw.cee_sheet ?? null };
  if (access?.kind === "authenticated" && !canAccessLeadRow(row, access)) {
    if (!(await canAccessLeadForCeeTeamManager(supabase, access, row.id))) {
      return null;
    }
  }

  return row;
}
