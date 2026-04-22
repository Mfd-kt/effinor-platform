"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { lgTable } from "@/features/lead-generation/lib/lg-db";
import { terminalOutcomeFromResolvedCallStatus } from "@/features/lead-generation/lib/terminal-call-status";
import { updateLeadGenerationAssignmentCallTraceSchema } from "@/features/lead-generation/schemas/update-lead-generation-assignment-call-trace.schema";
import { createClient } from "@/lib/supabase/server";
import { datetimeLocalToIso } from "@/lib/utils/datetime";

type RpcCloseRow = { result_code: string };

function mapTerminalCloseRpc(raw: RpcCloseRow[] | RpcCloseRow | null | undefined): string | null {
  const row = Array.isArray(raw) ? raw[0] : raw ?? undefined;
  const code = row?.result_code;
  if (code === "success") {
    return null;
  }
  switch (code) {
    case "not_found":
      return "Attribution introuvable.";
    case "forbidden":
      return "Cette attribution ne vous appartient pas.";
    case "already_converted":
      return "Cette fiche est déjà traitée côté CRM.";
    case "invalid_assignment_state":
      return "Cette attribution n’est plus modifiable.";
    case "stock_not_found":
      return "Fiche stock introuvable.";
    case "stock_mismatch":
      return "Incohérence attribution / fiche (contactez le support).";
    case "invalid_outcome":
      return "Statut de clôture invalide.";
    default:
      return code ? `Erreur : ${code}` : "Réponse serveur inattendue.";
  }
}

export type UpdateLeadGenerationAssignmentCallTraceResult =
  | { ok: true; removedFromQueue?: boolean }
  | { ok: false; message: string };

export async function updateLeadGenerationAssignmentCallTraceAction(
  input: unknown,
): Promise<UpdateLeadGenerationAssignmentCallTraceResult> {
  const parsed = updateLeadGenerationAssignmentCallTraceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const { assignmentId, last_call_status, last_call_at, last_call_note, last_call_recording_url } = parsed.data;

  const supabase = await createClient();
  const assignments = lgTable(supabase, "lead_generation_assignments");

  const { data: row, error: fetchError } = await assignments
    .select("id, agent_id, stock_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (fetchError || !row) {
    return { ok: false, message: fetchError?.message ?? "Attribution introuvable." };
  }

  const r = row as { id: string; agent_id: string; stock_id: string };
  if (r.agent_id !== access.userId) {
    return { ok: false, message: "Cette attribution ne vous appartient pas." };
  }

  let atIso: string | null = null;
  if (last_call_at) {
    atIso = datetimeLocalToIso(last_call_at);
    if (!atIso) {
      return { ok: false, message: "Date / heure d’appel invalide." };
    }
  }

  const terminalOutcome = terminalOutcomeFromResolvedCallStatus(last_call_status);

  if (terminalOutcome) {
    const { data, error } = await supabase.rpc("close_lead_generation_assignment_from_terminal_call", {
      p_assignment_id: assignmentId,
      p_agent_id: access.userId,
      p_outcome: terminalOutcome,
      p_last_call_status: last_call_status,
      p_last_call_at: atIso,
      p_last_call_note: last_call_note,
      p_last_call_recording_url: last_call_recording_url,
    });

    if (error) {
      return { ok: false, message: error.message };
    }
    const msg = mapTerminalCloseRpc(data as RpcCloseRow[] | RpcCloseRow | null);
    if (msg) {
      return { ok: false, message: msg };
    }
  } else {
    const { error } = await assignments
      .update({
        last_call_status,
        last_call_at: atIso,
        last_call_note,
        last_call_recording_url,
      })
      .eq("id", assignmentId)
      .eq("agent_id", access.userId);

    if (error) {
      return { ok: false, message: error.message };
    }
  }

  revalidatePath("/lead-generation/my-queue");
  revalidatePath(`/lead-generation/my-queue/${r.stock_id}`);

  return { ok: true, removedFromQueue: Boolean(terminalOutcome) };
}
