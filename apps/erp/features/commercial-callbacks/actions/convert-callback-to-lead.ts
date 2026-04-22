"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import { splitContactName } from "@/features/commercial-callbacks/lib/split-contact-name";
import { createLead } from "@/features/leads/actions/create-lead";
import { EMPTY_LEAD_FORM } from "@/features/leads/lib/form-defaults";
import { LeadInsertSchema } from "@/features/leads/schemas/lead.schema";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ callbackId: z.string().uuid() });

export type ConvertCallbackToLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

export type CreateCallbackLeadForSimulationResult =
  | { ok: true; leadId: string; callbackWasAlreadyConverted: boolean }
  | { ok: false; error: string };

/**
 * Crée le lead à partir du rappel sans marquer le rappel comme converti.
 * Utilisé pour enchaîner avec la validation du simulateur avant de clôturer le rappel.
 */
export async function createCommercialCallbackLeadForSimulation(
  raw: z.infer<typeof schema>,
): Promise<CreateCallbackLeadForSimulationResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Identifiant invalide." };
  }

  const supabase = await createClient();
  const { data: cb, error: fetchErr } = await supabase
    .from("commercial_callbacks")
    .select("*")
    .eq("id", parsed.data.callbackId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !cb) {
    return { ok: false, error: fetchErr?.message ?? "Rappel introuvable." };
  }

  if (cb.status === "converted_to_lead" && cb.converted_lead_id) {
    return { ok: true, leadId: cb.converted_lead_id, callbackWasAlreadyConverted: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { first_name, last_name } = splitContactName(cb.contact_name);
  const notesPrefix = `[Créé depuis rappel ${cb.id}]\n\n`;
  const noteBlocks = [cb.callback_comment, cb.call_context_summary].filter(
    (s): s is string => Boolean(s && String(s).trim()),
  );
  const recordingBody = noteBlocks.length > 0 ? noteBlocks.join("\n\n") : "";
  const parsedLead = LeadInsertSchema.safeParse({
    ...EMPTY_LEAD_FORM,
    source: "commercial_callback",
    company_name: cb.company_name,
    first_name: first_name || undefined,
    last_name: last_name || undefined,
    email: cb.email?.trim() || undefined,
    phone: cb.phone.trim(),
    lead_status: "new",
    head_office_address: "",
    head_office_postal_code: "",
    head_office_city: "",
    worksite_address: "",
    worksite_postal_code: "",
    worksite_city: "",
    recording_notes: `${notesPrefix}${recordingBody}`.trim(),
  });

  if (!parsedLead.success) {
    const first = parsedLead.error.issues[0];
    return { ok: false, error: first?.message ?? "Données lead invalides." };
  }

  const assignCreator = cb.assigned_agent_user_id ?? user?.id ?? null;
  const created = await createLead(parsedLead.data, {
    skipPremierContactEmail: true,
    createdByAgentId: assignCreator,
  });
  if (!created.ok) {
    return { ok: false, error: created.message };
  }

  return { ok: true, leadId: created.data.id, callbackWasAlreadyConverted: false };
}

export async function convertCommercialCallbackToLead(
  raw: z.infer<typeof schema>,
): Promise<ConvertCallbackToLeadResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Identifiant invalide." };
  }

  const supabase = await createClient();
  const { data: cb, error: fetchErr } = await supabase
    .from("commercial_callbacks")
    .select("id, status, converted_lead_id")
    .eq("id", parsed.data.callbackId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !cb) {
    return { ok: false, error: fetchErr?.message ?? "Rappel introuvable." };
  }

  if (cb.status === "converted_to_lead" && cb.converted_lead_id) {
    return { ok: true, leadId: cb.converted_lead_id };
  }

  const created = await createCommercialCallbackLeadForSimulation(parsed.data);
  if (!created.ok) {
    return { ok: false, error: created.error };
  }

  const leadId = created.leadId;

  const now = new Date().toISOString();
  const { error: updErr } = await supabase
    .from("commercial_callbacks")
    .update({
      status: "converted_to_lead",
      converted_lead_id: leadId,
      last_call_at: now,
      completed_at: now,
      call_started_at: null,
      in_progress_by_user_id: null,
    })
    .eq("id", cb.id);

  if (updErr) {
    return { ok: false, error: `Lead créé mais rappel non mis à jour : ${updErr.message}` };
  }

  revalidatePath("/leads");
  revalidatePath("/cockpit");
  revalidatePath("/commercial-callbacks");
  return { ok: true, leadId };
}
