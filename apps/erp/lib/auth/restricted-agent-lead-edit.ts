import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import type { AccessContext } from "./access-context";

/**
 * Agent « pur » : pas de rôle direction / confirmateur / closer qui doit pouvoir continuer à enrichir la fiche.
 */
export function isRestrictedFieldAgent(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  const rc = access.roleCodes;
  if (!rc.includes("sales_agent")) {
    return false;
  }
  const bypass = ["super_admin", "admin", "sales_director", "closer", "confirmer"] as const;
  return !bypass.some((r) => rc.includes(r));
}

/**
 * TODO: cee-workflows retiré — `isWorkflowLockedForAgentEdit` provenait du module workflow CEE.
 * En attendant le nouveau pipeline workflow, on n'applique plus de blocage : un agent restreint
 * peut éditer (retour `null`). Idem pour la lecture seule consultation (retour `false`).
 *
 * Les signatures publiques sont conservées identiques.
 */
export async function getRestrictedAgentLeadEditBlockReason(
  _supabase: SupabaseClient<Database>,
  _access: AccessContext,
  _leadId: string,
): Promise<string | null> {
  return null;
}

export async function isRestrictedAgentLeadConsultationReadOnly(
  _supabase: SupabaseClient<Database>,
  _access: AccessContext,
  _leadId: string,
): Promise<boolean> {
  return false;
}
