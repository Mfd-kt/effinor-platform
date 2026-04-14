"use server";

import { revalidatePath } from "next/cache";

import { insertFromBeneficiaryForm } from "@/features/beneficiaries/lib/map-to-db";
import { BeneficiaryInsertSchema } from "@/features/beneficiaries/schemas/beneficiary.schema";
import { fetchLeadInternalNotesPlainBlock } from "@/features/leads/lib/lead-internal-notes-export";
import { findProbableDuplicateBeneficiaryId } from "@/features/technical-visits/lib/find-probable-duplicate-beneficiary";
import { buildBeneficiaryInsertInputFromLeadAndVt } from "@/features/technical-visits/lib/map-lead-to-beneficiary-insert";
import { createClient } from "@/lib/supabase/server";

export type CreateBeneficiaryFromTechnicalVisitResult =
  | { ok: true; beneficiaryId: string }
  | {
      ok: false;
      message: string;
      existingBeneficiaryId?: string;
      code?:
        | "DUPLICATE"
        | "ALREADY_LINKED"
        | "LEAD_CONVERTED"
        | "LEAD_MISSING"
        | "NOT_FOUND"
        | "VALIDATION";
    };

export async function createBeneficiaryFromTechnicalVisit(
  technicalVisitId: string,
): Promise<CreateBeneficiaryFromTechnicalVisitResult> {
  const id = technicalVisitId?.trim();
  if (!id) {
    return { ok: false, message: "Identifiant de visite technique manquant.", code: "NOT_FOUND" };
  }

  const supabase = await createClient();

  const { data: vt, error: vtError } = await supabase
    .from("technical_visits")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (vtError) {
    return { ok: false, message: vtError.message };
  }
  if (!vt) {
    return { ok: false, message: "Visite technique introuvable.", code: "NOT_FOUND" };
  }

  if (vt.beneficiary_id) {
    return {
      ok: false,
      message: "Un bénéficiaire est déjà lié à cette visite.",
      existingBeneficiaryId: vt.beneficiary_id,
      code: "ALREADY_LINKED",
    };
  }

  const leadId = vt.lead_id;
  if (!leadId) {
    return {
      ok: false,
      message: "Cette visite n’a pas de lead associé (données incohérentes).",
      code: "LEAD_MISSING",
    };
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    return { ok: false, message: leadError.message };
  }
  if (!lead) {
    return { ok: false, message: "Lead introuvable.", code: "NOT_FOUND" };
  }

  if (lead.converted_beneficiary_id) {
    return {
      ok: false,
      message:
        "Ce lead a déjà un bénéficiaire de conversion. Ouvrez la fiche existante ou liez la visite manuellement depuis le formulaire.",
      existingBeneficiaryId: lead.converted_beneficiary_id,
      code: "LEAD_CONVERTED",
    };
  }

  const duplicateId = await findProbableDuplicateBeneficiaryId(supabase, lead);
  if (duplicateId) {
    return {
      ok: false,
      message:
        "Un bénéficiaire avec la même raison sociale et le même email ou téléphone existe déjà. Ouvrez la fiche existante pour éviter un doublon.",
      existingBeneficiaryId: duplicateId,
      code: "DUPLICATE",
    };
  }

  const internalNotesBlock = await fetchLeadInternalNotesPlainBlock(supabase, leadId);
  const insertInput = buildBeneficiaryInsertInputFromLeadAndVt(lead, vt, internalNotesBlock);
  const parsed = BeneficiaryInsertSchema.safeParse(insertInput);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Les données du lead ne permettent pas de créer un bénéficiaire valide.",
      code: "VALIDATION",
    };
  }

  const row = insertFromBeneficiaryForm(parsed.data);
  const { data: created, error: insertError } = await supabase
    .from("beneficiaries")
    .insert(row)
    .select("id")
    .single();

  if (insertError || !created) {
    return {
      ok: false,
      message: insertError?.message ?? "Échec de la création du bénéficiaire.",
    };
  }

  const beneficiaryId = created.id;

  const { error: updateVtError } = await supabase
    .from("technical_visits")
    .update({ beneficiary_id: beneficiaryId })
    .eq("id", id)
    .is("deleted_at", null);

  if (updateVtError) {
    return {
      ok: false,
      message: `Bénéficiaire créé (${beneficiaryId}) mais la visite n’a pas pu être mise à jour : ${updateVtError.message}`,
    };
  }

  const { error: updateLeadError } = await supabase
    .from("leads")
    .update({ converted_beneficiary_id: beneficiaryId })
    .eq("id", leadId)
    .is("converted_beneficiary_id", null);

  if (updateLeadError) {
    // Non bloquant : la VT est déjà liée
    console.error("createBeneficiaryFromTechnicalVisit: lead update failed", updateLeadError);
  }

  revalidatePath("/beneficiaries");
  revalidatePath(`/beneficiaries/${beneficiaryId}`);
  revalidatePath("/technical-visits");
  revalidatePath(`/technical-visits/${id}`);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);

  return { ok: true, beneficiaryId };
}
