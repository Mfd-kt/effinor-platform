import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import {
  canAccessLeadForAssignedWorkflowRole,
  canAccessLeadForCeeTeamManager,
} from "@/lib/auth/switch-cee-sheet-eligibility";
import { getActiveLeadExtensions } from "@/features/leads/lib/lead-extensions-access";

import type { LeadDetailRow, LeadDetailWithExtensions } from "@/features/leads/types";

export async function getLeadById(
  id: string,
  access?: AccessContext,
): Promise<LeadDetailWithExtensions | null> {
  const supabase = await createClient();

  const [{ data, error }, { b2b, b2c }] = await Promise.all([
    supabase
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
      .maybeSingle(),
    getActiveLeadExtensions(supabase, id),
  ]);

  if (error) {
    throw new Error(`Impossible de charger le lead : ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const raw = data as unknown as LeadDetailRow & { cee_sheet?: LeadDetailRow["cee_sheet"] | null };
  const row: LeadDetailRow = { ...raw, cee_sheet: raw.cee_sheet ?? null };
  if (access?.kind === "authenticated" && !canAccessLeadRow(row, access)) {
    const canAccessByWorkflowAssignment = await canAccessLeadForAssignedWorkflowRole(
      supabase,
      access,
      row.id,
    );
    if (!canAccessByWorkflowAssignment && !(await canAccessLeadForCeeTeamManager(supabase, access, row.id))) {
      return null;
    }
  }

  return { ...row, b2b, b2c };
}
