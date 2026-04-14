import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { isWorkflowLockedForAgentEdit } from "@/features/cee-workflows/lib/agent-lead-consultation";

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

const BLOCK_MESSAGE =
  "Ce dossier a été transmis au confirmateur : la fiche est en lecture seule pour votre compte agent.";

/**
 * Si non-null, les mutations lead (formulaire, médias, notes) doivent être refusées pour un agent restreint.
 */
export async function getRestrictedAgentLeadEditBlockReason(
  supabase: SupabaseClient<Database>,
  access: AccessContext,
  leadId: string,
): Promise<string | null> {
  if (access.kind !== "authenticated") {
    return "Non authentifié.";
  }
  if (!isRestrictedFieldAgent(access)) {
    return null;
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .select("current_workflow_id")
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !lead) {
    return null;
  }

  const workflowId = lead.current_workflow_id;

  const { data: wf, error: wfError } = workflowId
    ? await supabase
        .from("lead_sheet_workflows")
        .select("workflow_status")
        .eq("id", workflowId)
        .maybeSingle()
    : await supabase
        .from("lead_sheet_workflows")
        .select("workflow_status")
        .eq("lead_id", leadId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

  if (wfError || !wf) {
    return null;
  }

  if (isWorkflowLockedForAgentEdit(wf.workflow_status)) {
    return BLOCK_MESSAGE;
  }

  return null;
}

/**
 * Indique si la fiche lead doit s’afficher en lecture seule pour un agent restreint (aligné sur les actions serveur).
 */
export async function isRestrictedAgentLeadConsultationReadOnly(
  supabase: SupabaseClient<Database>,
  access: AccessContext,
  leadId: string,
): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  const msg = await getRestrictedAgentLeadEditBlockReason(supabase, access, leadId);
  return msg !== null;
}
