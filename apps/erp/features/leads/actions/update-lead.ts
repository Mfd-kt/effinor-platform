"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { getRestrictedAgentLeadEditBlockReason } from "@/lib/auth/restricted-agent-lead-edit";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { updateFromLeadForm } from "@/features/leads/lib/map-to-db";
import {
  isMissingSplitSiretColumnError,
  stripSplitSiretColumns,
} from "@/features/leads/lib/lead-siret-compat";
import { LeadUpdatePayloadSchema } from "@/features/leads/schemas/lead.schema";
import type { LeadRow } from "@/features/leads/types";
import { createClient } from "@/lib/supabase/server";

export type UpdateLeadResult =
  | { ok: true; data: LeadRow }
  | { ok: false; message: string };

export async function updateLead(input: unknown): Promise<UpdateLeadResult> {
  const parsed = LeadUpdatePayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const { id, ...rest } = parsed.data;

  const supabase = await createClient();
  const { data: existingRow, error: fetchError } = await supabase
    .from("leads")
    .select("id, created_by_agent_id, confirmed_by_user_id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError || !existingRow) {
    return { ok: false, message: fetchError?.message ?? "Lead introuvable." };
  }

  if (!canAccessLeadRow(existingRow, access)) {
    return { ok: false, message: "Accès refusé à ce lead." };
  }

  const agentBlock = await getRestrictedAgentLeadEditBlockReason(supabase, access, id);
  if (agentBlock) {
    return { ok: false, message: agentBlock };
  }

  let restForPatch = rest;
  if (!isSuperAdmin(access.roleCodes)) {
    const { created_by_agent_id: _c, ...withoutCreator } = rest;
    void _c;
    restForPatch = withoutCreator as typeof rest;
  }

  const patch = updateFromLeadForm(restForPatch);

  if (Object.keys(patch).length === 0) {
    const { data: existing, error: fullFetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (fullFetchError || !existing) {
      return { ok: false, message: fullFetchError?.message ?? "Lead introuvable." };
    }
    return { ok: true, data: existing };
  }

  let { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error && isMissingSplitSiretColumnError(error.message)) {
    ({ data, error } = await supabase
      .from("leads")
      .update(stripSplitSiretColumns(patch))
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single());
  }

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Lead introuvable ou déjà supprimé." };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/confirmateur");
  revalidatePath("/closer");
  return { ok: true, data };
}
