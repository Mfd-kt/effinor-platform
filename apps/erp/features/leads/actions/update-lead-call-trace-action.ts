"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { getRestrictedAgentLeadEditBlockReason } from "@/lib/auth/restricted-agent-lead-edit";
import { updateLeadCallTraceSchema } from "@/features/leads/schemas/lead-call-trace.schema";
import { createClient } from "@/lib/supabase/server";
import { datetimeLocalToIso } from "@/lib/utils/datetime";

export type UpdateLeadCallTraceResult = { ok: true } | { ok: false; message: string };

export async function updateLeadCallTraceAction(input: unknown): Promise<UpdateLeadCallTraceResult> {
  const parsed = updateLeadCallTraceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const { leadId, last_call_status, last_call_at, last_call_note, last_call_recording_url } = parsed.data;

  const supabase = await createClient();
  const { data: existingRow, error: fetchError } = await supabase
    .from("leads")
    .select("id, created_by_agent_id, confirmed_by_user_id, lead_status")
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError || !existingRow) {
    return { ok: false, message: fetchError?.message ?? "Lead introuvable." };
  }

  if (!canAccessLeadRow(existingRow, access)) {
    return { ok: false, message: "Accès refusé à ce lead." };
  }

  const agentBlock = await getRestrictedAgentLeadEditBlockReason(supabase, access, leadId);
  if (agentBlock) {
    return { ok: false, message: agentBlock };
  }

  let atIso: string | null = null;
  if (last_call_at) {
    atIso = datetimeLocalToIso(last_call_at);
    if (!atIso) {
      return { ok: false, message: "Date / heure d’appel invalide." };
    }
  }

  const { error } = await supabase
    .from("leads")
    .update({
      last_call_status,
      last_call_at: atIso,
      last_call_note,
      last_call_recording_url,
    })
    .eq("id", leadId)
    .is("deleted_at", null);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);

  return { ok: true };
}
