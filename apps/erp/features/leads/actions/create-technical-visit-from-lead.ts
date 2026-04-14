"use server";

import { revalidatePath } from "next/cache";

import { leadAddressesComplete } from "@/features/leads/lib/lead-address-validation";
import { fetchLeadInternalNotesPlainBlock } from "@/features/leads/lib/lead-internal-notes-export";
import { buildTechnicalVisitDefaultsFromLead } from "@/features/leads/lib/lead-to-technical-visit";
import { linkTechnicalVisitToWorkflow } from "@/features/cee-workflows/services/workflow-service";
import type { LeadRow } from "@/features/leads/types";
import { ACTIVE_TECHNICAL_VISIT_STATUSES } from "@/features/leads/constants/technical-visit-active-statuses";
import { geocodeWorksiteForSave } from "@/features/technical-visits/lib/geocode-worksite-for-save";
import { insertFromTechnicalVisitForm } from "@/features/technical-visits/lib/map-to-db";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { getRestrictedAgentLeadEditBlockReason } from "@/lib/auth/restricted-agent-lead-edit";
import { createClient } from "@/lib/supabase/server";

export type CreateTechnicalVisitFromLeadResult =
  | { ok: true; technicalVisitId: string }
  | { ok: false; message: string; existingTechnicalVisitId?: string };

/**
 * Crée une visite technique en base à partir d’un lead qualifié.
 * Garde-fous : adresses complètes, société, pas de VT active existante, lead non terminal.
 * Le confirmateur est renseigné sur le lead à la création de la VT (utilisateur courant si vide).
 */
export async function createTechnicalVisitFromLead(
  leadId: string,
): Promise<CreateTechnicalVisitFromLeadResult> {
  const trimmedId = leadId?.trim();
  if (!trimmedId) {
    return { ok: false, message: "Identifiant lead manquant." };
  }

  const supabase = await createClient();

  const { data: leadRow, error: fetchError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", trimmedId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }

  if (!leadRow) {
    return { ok: false, message: "Lead introuvable ou supprimé." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const leadAccessRow = {
    created_by_agent_id: leadRow.created_by_agent_id as string | null,
    confirmed_by_user_id: leadRow.confirmed_by_user_id as string | null,
  };
  if (!canAccessLeadRow(leadAccessRow, access)) {
    return { ok: false, message: "Accès refusé à ce lead." };
  }

  const agentBlock = await getRestrictedAgentLeadEditBlockReason(supabase, access, trimmedId);
  if (agentBlock) {
    return { ok: false, message: agentBlock };
  }

  const lead = leadRow as unknown as LeadRow;

  if (lead.lead_status === "lost" || lead.lead_status === "converted") {
    return {
      ok: false,
      message:
        "Ce lead est en statut terminal (perdu ou converti) : création de visite technique impossible.",
    };
  }

  if (!lead.company_name?.trim()) {
    return { ok: false, message: "Le nom de la société est obligatoire." };
  }

  if (!leadAddressesComplete(lead)) {
    return {
      ok: false,
      message:
        "Complétez les six champs d’adresse (siège et travaux : adresse, code postal, ville).",
    };
  }

  const { data: existingActive, error: existingError } = await supabase
    .from("technical_visits")
    .select("id, vt_reference")
    .eq("lead_id", trimmedId)
    .is("deleted_at", null)
    .in("status", [...ACTIVE_TECHNICAL_VISIT_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: existingError.message };
  }

  if (existingActive) {
    return {
      ok: false,
      message: "Une visite technique existe déjà pour ce lead (statut actif).",
      existingTechnicalVisitId: existingActive.id,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Session expirée." };
  }

  const internalNotesBlock = await fetchLeadInternalNotesPlainBlock(supabase, trimmedId);
  const defaults = buildTechnicalVisitDefaultsFromLead(lead, { internalNotesBlock });
  const insertRow = insertFromTechnicalVisitForm(defaults);
  insertRow.created_by_user_id = user.id;
  insertRow.workflow_id = lead.current_workflow_id ?? null;

  const { lat, lng } = await geocodeWorksiteForSave({
    worksite_address: insertRow.worksite_address,
    worksite_postal_code: insertRow.worksite_postal_code,
    worksite_city: insertRow.worksite_city,
  });
  insertRow.worksite_latitude = lat;
  insertRow.worksite_longitude = lng;

  const { data: vt, error: insertError } = await supabase
    .from("technical_visits")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  if (!vt?.id) {
    return { ok: false, message: "Aucune donnée retournée après création de la visite." };
  }

  /** Confirmateur : l’utilisateur qui crée la VT est enregistré sur le lead (si encore vide). */
  if (user.id) {
    await supabase
      .from("leads")
      .update({ confirmed_by_user_id: user.id })
      .eq("id", trimmedId)
      .is("deleted_at", null)
      .is("confirmed_by_user_id", null);
  }

  /**
   * Après ouverture d’une VT, faire progresser le pipeline sur le lead.
   * Enum `lead_status` : on passe à `qualified` lorsque le lead n’y est pas encore
   * (pas de nouveau statut dans la migration — évite `converted`/`lost` déjà filtrés).
   */
  if (lead.lead_status !== "qualified") {
    await supabase
      .from("leads")
      .update({ lead_status: "qualified" })
      .eq("id", trimmedId)
      .is("deleted_at", null);
  }

  if (lead.current_workflow_id) {
    await linkTechnicalVisitToWorkflow(supabase, {
      workflowId: lead.current_workflow_id,
      technicalVisitId: vt.id,
      actorUserId: user.id,
      markDone: false,
    });
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${trimmedId}`);
  revalidatePath("/technical-visits");
  revalidatePath(`/technical-visits/${vt.id}`);

  return { ok: true, technicalVisitId: vt.id };
}
