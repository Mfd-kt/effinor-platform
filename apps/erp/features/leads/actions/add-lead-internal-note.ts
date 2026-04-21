"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { getRestrictedAgentLeadEditBlockReason } from "@/lib/auth/restricted-agent-lead-edit";
import { canAccessLeadForAssignedWorkflowRole } from "@/lib/auth/switch-cee-sheet-eligibility";
import { createClient } from "@/lib/supabase/server";

const AddNoteSchema = z.object({
  leadId: z.string().uuid("Lead invalide."),
  body: z
    .string()
    .min(1, "Saisissez une note.")
    .max(20_000, "Note trop longue (20 000 caractères max).")
    .transform((s) => s.trim()),
});

export type AddLeadInternalNoteResult = { ok: true } | { ok: false; message: string };

export async function addLeadInternalNote(input: unknown): Promise<AddLeadInternalNoteResult> {
  const parsed = AddNoteSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { ok: false, message: "Vous devez être connecté pour ajouter une note." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const { data: leadRow, error: leadFetchError } = await supabase
    .from("leads")
    .select("id, created_by_agent_id, confirmed_by_user_id")
    .eq("id", parsed.data.leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (leadFetchError || !leadRow) {
    return { ok: false, message: leadFetchError?.message ?? "Lead introuvable." };
  }

  const hasLeadScopeAccess = canAccessLeadRow(leadRow, access);
  const hasWorkflowAssignedAccess = hasLeadScopeAccess
    ? true
    : await canAccessLeadForAssignedWorkflowRole(supabase, access, parsed.data.leadId);
  if (!hasLeadScopeAccess && !hasWorkflowAssignedAccess) {
    return { ok: false, message: "Accès refusé à ce lead." };
  }

  const agentBlock = await getRestrictedAgentLeadEditBlockReason(supabase, access, parsed.data.leadId);
  if (agentBlock) {
    return { ok: false, message: agentBlock };
  }

  const { error } = await supabase.from("lead_internal_notes").insert({
    lead_id: parsed.data.leadId,
    body: parsed.data.body,
    created_by: user.id,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${parsed.data.leadId}`);
  return { ok: true };
}
