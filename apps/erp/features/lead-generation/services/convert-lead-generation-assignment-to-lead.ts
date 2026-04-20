import { createClient } from "@/lib/supabase/server";

import type { CommercialPipelineStatus } from "../domain/commercial-pipeline-status";
import type {
  ConvertLeadGenerationAssignmentInput,
  ConvertLeadGenerationAssignmentResult,
} from "../domain/convert-assignment-result";
import { lgTable } from "../lib/lg-db";

import { recordLeadGenerationConversionJournalEvents } from "./record-lead-generation-conversion-journal";

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
  const assignments = lgTable(supabase, "lead_generation_assignments");

  const { data: beforeRow } = await assignments
    .select("stock_id, agent_id, commercial_pipeline_status, outcome")
    .eq("id", input.assignmentId)
    .maybeSingle();

  const { data, error } = await supabase.rpc("convert_lead_generation_assignment_to_lead", {
    p_assignment_id: input.assignmentId,
    p_agent_id: input.agentId,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  const raw = data as RpcRow[] | RpcRow | null | undefined;
  const row = Array.isArray(raw) ? raw[0] : raw ?? undefined;
  const result = mapRpcRow(row);

  if (result.status === "success" && beforeRow) {
    const b = beforeRow as {
      stock_id: string;
      agent_id: string;
      commercial_pipeline_status: string | null;
      outcome: string;
    };
    const { data: afterRow } = await assignments
      .select("commercial_pipeline_status, outcome")
      .eq("id", input.assignmentId)
      .maybeSingle();
    if (afterRow) {
      const a = afterRow as { commercial_pipeline_status: string | null; outcome: string };
      await recordLeadGenerationConversionJournalEvents(supabase, {
        assignmentId: input.assignmentId,
        agentId: input.agentId,
        stockId: b.stock_id,
        beforePipeline: (b.commercial_pipeline_status ?? "new") as CommercialPipelineStatus,
        beforeOutcome: b.outcome,
        afterPipeline: (a.commercial_pipeline_status ?? "converted") as CommercialPipelineStatus,
        afterOutcome: a.outcome,
        rpcName: "convert_lead_generation_assignment_to_lead",
        leadId: result.leadId,
      });
    }
  }

  return result;
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
  const assignments = lgTable(supabase, "lead_generation_assignments");

  const { data: beforeRow } = await assignments
    .select("stock_id, agent_id, commercial_pipeline_status, outcome")
    .eq("id", input.assignmentId)
    .maybeSingle();

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
  const result = mapRpcRow(row);

  if (result.status === "success" && beforeRow) {
    const b = beforeRow as {
      stock_id: string;
      agent_id: string;
      commercial_pipeline_status: string | null;
      outcome: string;
    };
    const { data: afterRow } = await assignments
      .select("commercial_pipeline_status, outcome")
      .eq("id", input.assignmentId)
      .maybeSingle();
    if (afterRow) {
      const a = afterRow as { commercial_pipeline_status: string | null; outcome: string };
      await recordLeadGenerationConversionJournalEvents(supabase, {
        assignmentId: input.assignmentId,
        agentId: input.agentId,
        stockId: b.stock_id,
        beforePipeline: (b.commercial_pipeline_status ?? "new") as CommercialPipelineStatus,
        beforeOutcome: b.outcome,
        afterPipeline: (a.commercial_pipeline_status ?? "converted") as CommercialPipelineStatus,
        afterOutcome: a.outcome,
        rpcName: "finalize_lead_generation_conversion_with_existing_lead",
        leadId: input.leadId,
      });
    }
  }

  return result;
}
