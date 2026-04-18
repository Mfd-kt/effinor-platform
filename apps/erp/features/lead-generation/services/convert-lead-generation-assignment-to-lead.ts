import { createClient } from "@/lib/supabase/server";

import type {
  ConvertLeadGenerationAssignmentInput,
  ConvertLeadGenerationAssignmentResult,
} from "../domain/convert-assignment-result";

type RpcRow = { result_code: string; lead_id: string | null };

function mapRpcRow(row: RpcRow | undefined): ConvertLeadGenerationAssignmentResult {
  if (!row) {
    return { status: "error", message: "Réponse RPC vide." };
  }

  const code = row.result_code;
  const leadId = row.lead_id;

  switch (code) {
    case "success":
      if (!leadId) {
        return { status: "error", message: "Succès sans identifiant lead." };
      }
      return { status: "success", leadId };
    case "already_converted":
      return { status: "already_converted" };
    case "invalid_assignment_state":
      return { status: "invalid_assignment_state" };
    case "forbidden":
      return { status: "forbidden" };
    case "not_found":
      return { status: "not_found" };
    case "error":
      return { status: "error", message: "Erreur signalée par la base." };
    default:
      return { status: "error", message: `Code RPC inconnu : ${code}` };
  }
}

/**
 * Convertit une assignment lead generation en `public.leads` (RPC transactionnelle Postgres).
 */
export async function convertLeadGenerationAssignmentToLead(
  input: ConvertLeadGenerationAssignmentInput,
): Promise<ConvertLeadGenerationAssignmentResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("convert_lead_generation_assignment_to_lead", {
    p_assignment_id: input.assignmentId,
    p_agent_id: input.agentId,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  const raw = data as RpcRow[] | RpcRow | null | undefined;
  const row = Array.isArray(raw) ? raw[0] : raw ?? undefined;
  return mapRpcRow(row);
}

/**
 * Après création / validation simulateur côté agent : rattache le lead CRM à la fiche lead-generation.
 */
export async function finalizeLeadGenerationConversionWithExistingLead(input: {
  assignmentId: string;
  agentId: string;
  leadId: string;
}): Promise<ConvertLeadGenerationAssignmentResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("finalize_lead_generation_conversion_with_existing_lead", {
    p_assignment_id: input.assignmentId,
    p_agent_id: input.agentId,
    p_lead_id: input.leadId,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  const raw = data as RpcRow[] | RpcRow | null | undefined;
  const row = Array.isArray(raw) ? raw[0] : raw ?? undefined;
  return mapRpcRow(row);
}
