import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccessContext } from "@/lib/auth/access-context";
import { resolveAllowedCeeSheetIdsForAccess } from "@/lib/auth/cee-workflows-scope";
import { userIsActiveCeeTeamManager } from "@/lib/auth/cockpit-variant";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { canSwitchLeadCeeSheetByAppRole } from "@/lib/auth/lead-permissions";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

/** Closer, super admin, ou manager d’équipe CEE actif. */
export async function canUserSwitchLeadCeeSheet(access: AccessContext): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (canSwitchLeadCeeSheetByAppRole(access.roleCodes)) {
    return true;
  }
  return userIsActiveCeeTeamManager(access.userId);
}

/** Manager d’équipe CEE : accès au lead si le dossier est sur une fiche CEE couverte par son équipe. */
export async function canAccessLeadForCeeTeamManager(
  supabase: Supabase,
  access: AccessContext,
  leadId: string,
): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (!(await userIsActiveCeeTeamManager(access.userId))) {
    return false;
  }
  const allowed = await resolveAllowedCeeSheetIdsForAccess(supabase, access);
  if (allowed === "all") {
    return true;
  }
  if (allowed.length === 0) {
    return false;
  }
  const allowedSet = new Set(allowed);

  const { data: leadOnly } = await supabase.from("leads").select("cee_sheet_id").eq("id", leadId).maybeSingle();
  if (leadOnly?.cee_sheet_id && allowedSet.has(leadOnly.cee_sheet_id)) {
    return true;
  }

  const { data: wfs } = await supabase
    .from("lead_sheet_workflows")
    .select("cee_sheet_id")
    .eq("lead_id", leadId)
    .eq("is_archived", false);
  for (const w of wfs ?? []) {
    if (w.cee_sheet_id && allowedSet.has(w.cee_sheet_id)) {
      return true;
    }
  }
  return false;
}

/**
 * Accès ponctuel au lead via assignation workflow active (agent / closer).
 * Utile pour ouvrir la fiche depuis les postes CEE quand la matrice leads est plus restrictive.
 */
export async function canAccessLeadForAssignedWorkflowRole(
  supabase: Supabase,
  access: AccessContext,
  leadId: string,
): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  const { data, error } = await supabase
    .from("lead_sheet_workflows")
    .select("id")
    .eq("lead_id", leadId)
    .eq("is_archived", false)
    .or(
      `assigned_agent_user_id.eq.${access.userId},assigned_closer_user_id.eq.${access.userId}`,
    )
    .limit(1)
    .maybeSingle();
  if (error) {
    return false;
  }
  return Boolean(data?.id);
}

/**
 * Peut exécuter un changement de fiche CEE sur ce lead : rôle éligible + périmètre lead
 * (créateur ou fiche CEE du dossier couverte par l’équipe du manager).
 */
export async function canUserSwitchLeadCeeSheetOnLead(
  supabase: Supabase,
  access: AccessContext,
  lead: {
    id: string;
    created_by_agent_id: string | null;
    confirmed_by_user_id: string | null;
  },
): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (!(await canUserSwitchLeadCeeSheet(access))) {
    return false;
  }
  if (canAccessLeadRow(lead, access)) {
    return true;
  }
  return canAccessLeadForCeeTeamManager(supabase, access, lead.id);
}
