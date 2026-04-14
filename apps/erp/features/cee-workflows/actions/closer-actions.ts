"use server";

import { revalidatePath } from "next/cache";

import { appendWorkflowEvent, markAgreementSent, markAgreementSigned, markWorkflowLost } from "@/features/cee-workflows/actions/workflow-actions";
import { canMarkAgreementAsSigned, hasCommercialDocuments } from "@/features/cee-workflows/lib/closer-guards";
import {
  CloserFollowUpSchema,
  CloserMarkLostSchema,
  CloserMarkSignedSchema,
  CloserResendAgreementSchema,
  CloserSendAgreementSchema,
  CloserSendToSignatureSchema,
  PrepareCloserCommercialDocumentsSchema,
  SaveCloserNotesSchema,
} from "@/features/cee-workflows/schemas/closer-workspace.schema";
import { saveWorkflowQualificationDraft } from "@/features/cee-workflows/services/workflow-service";
import { generateLeadStudyPdf } from "@/features/leads/study-pdf/actions/generate-lead-study-pdf";
import { sendStudyEmail } from "@/features/leads/study-pdf/actions/send-study-email";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

type CloserActionResult =
  | { ok: true; workflowId: string }
  | { ok: false; message: string };

function revalidateCloserPaths(_workflowId: string, leadId?: string) {
  revalidatePath("/closer");
  if (leadId) {
    revalidatePath(`/leads/${leadId}`);
  }
}

async function getWorkflowSnapshot(workflowId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_sheet_workflows")
    .select("id, lead_id, workflow_status, agreement_sent_at, qualification_data_json")
    .eq("id", workflowId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Workflow introuvable.");
  }
  return data;
}

function mergeCloserJson(
  base: unknown,
  patch: Record<string, unknown>,
): Json {
  const current =
    base && typeof base === "object" && !Array.isArray(base)
      ? (base as Record<string, unknown>)
      : {};
  return { ...current, ...patch } as Json;
}

export async function saveCloserNotes(input: unknown): Promise<CloserActionResult> {
  const parsed = SaveCloserNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  try {
    const supabase = await createClient();
    const workflow = await getWorkflowSnapshot(parsed.data.workflowId);
    await saveWorkflowQualificationDraft(supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: access.userId,
      qualificationDataJson: mergeCloserJson(workflow.qualification_data_json, {
        closer_notes: parsed.data.closer_notes,
        objection_code: parsed.data.objection_code,
        objection_detail: parsed.data.objection_detail,
        last_contact_at: parsed.data.last_contact_at,
        next_follow_up_at: parsed.data.next_follow_up_at,
        call_outcome: parsed.data.call_outcome,
        loss_reason: parsed.data.loss_reason,
      }),
    });

    await appendWorkflowEvent({
      workflowId: parsed.data.workflowId,
      eventType: "closer_notes_saved",
      eventLabel: "Notes closer enregistrées",
      payloadJson: {
        call_outcome: parsed.data.call_outcome,
        next_follow_up_at: parsed.data.next_follow_up_at,
      },
    });

    revalidateCloserPaths(workflow.id, workflow.lead_id);
    return { ok: true, workflowId: workflow.id };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

async function sendAgreementEmailInternal(
  payload: {
    workflowId: string;
    leadId: string;
    clientEmail: string;
    clientName: string;
    companyName: string;
    siteName: string;
    presentationUrl: string;
    accordUrl: string;
    emailVariant?: "A" | "B";
  },
  emailType: "study" | "relance_signature",
): Promise<CloserActionResult> {
  const result = await sendStudyEmail({
    to: payload.clientEmail,
    leadId: payload.leadId,
    clientName: payload.clientName,
    companyName: payload.companyName,
    siteName: payload.siteName,
    presentationUrl: payload.presentationUrl,
    accordUrl: payload.accordUrl,
    variant: payload.emailVariant ?? "A",
    emailType,
  });
  if (!result.ok) {
    return { ok: false, message: result.error };
  }
  revalidateCloserPaths(payload.workflowId, payload.leadId);
  return { ok: true, workflowId: payload.workflowId };
}

export async function sendCloserAgreement(input: unknown): Promise<CloserActionResult> {
  const parsed = CloserSendAgreementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  if (!hasCommercialDocuments({ presentationUrl: parsed.data.presentationUrl, agreementUrl: parsed.data.accordUrl })) {
    return { ok: false, message: "Les documents commerciaux sont manquants." };
  }
  return sendAgreementEmailInternal(parsed.data, "study");
}

export async function resendAgreement(input: unknown): Promise<CloserActionResult> {
  const parsed = CloserResendAgreementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  if (!hasCommercialDocuments({ presentationUrl: parsed.data.presentationUrl, agreementUrl: parsed.data.accordUrl })) {
    return { ok: false, message: "Les documents commerciaux sont manquants." };
  }
  return sendAgreementEmailInternal(parsed.data, "relance_signature");
}

export async function sendAgreementForSignature(input: unknown): Promise<CloserActionResult> {
  const parsed = CloserSendToSignatureSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  if (!hasCommercialDocuments({ presentationUrl: parsed.data.presentationUrl, agreementUrl: parsed.data.accordUrl })) {
    return { ok: false, message: "Les documents commerciaux sont manquants." };
  }

  const result = await sendStudyEmail({
    to: parsed.data.clientEmail,
    leadId: parsed.data.leadId,
    clientName: parsed.data.clientName,
    companyName: parsed.data.companyName,
    siteName: parsed.data.siteName,
    presentationUrl: parsed.data.presentationUrl,
    accordUrl: parsed.data.accordUrl,
    variant: "A",
    emailType: "study",
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  await appendWorkflowEvent({
    workflowId: parsed.data.workflowId,
    eventType: "signature_requested_fallback_email",
    eventLabel: "Demande de signature envoyée par email (fallback)",
    payloadJson: { mode: "email_fallback" },
  });

  revalidateCloserPaths(parsed.data.workflowId, parsed.data.leadId);
  return { ok: true, workflowId: parsed.data.workflowId };
}

export async function markCloserAgreementSent(input: unknown): Promise<CloserActionResult> {
  const parsed = CloserMarkSignedSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const result = await markAgreementSent({
    workflowId: parsed.data.workflowId,
    signatureProvider: "manual",
    signatureStatus: "sent",
  });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  const snapshot = await getWorkflowSnapshot(parsed.data.workflowId);
  revalidateCloserPaths(parsed.data.workflowId, snapshot.lead_id);
  return { ok: true, workflowId: parsed.data.workflowId };
}

export async function markCloserAgreementSigned(input: unknown): Promise<CloserActionResult> {
  const parsed = CloserMarkSignedSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const snapshot = await getWorkflowSnapshot(parsed.data.workflowId);
  if (!canMarkAgreementAsSigned({ workflowStatus: snapshot.workflow_status, agreementSentAt: snapshot.agreement_sent_at })) {
    return { ok: false, message: "Impossible de marquer signé avant envoi de l'accord." };
  }
  const result = await markAgreementSigned({
    workflowId: parsed.data.workflowId,
    signatureProvider: "manual",
    signatureStatus: "signed",
  });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  revalidateCloserPaths(parsed.data.workflowId, snapshot.lead_id);
  return { ok: true, workflowId: parsed.data.workflowId };
}

export async function markCloserWorkflowLost(input: unknown): Promise<CloserActionResult> {
  const parsed = CloserMarkLostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const result = await markWorkflowLost({
    workflowId: parsed.data.workflowId,
    reason: parsed.data.lossReason,
  });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  const snapshot = await getWorkflowSnapshot(parsed.data.workflowId);
  revalidateCloserPaths(parsed.data.workflowId, snapshot.lead_id);
  return { ok: true, workflowId: parsed.data.workflowId };
}

export async function prepareCloserCommercialDocuments(input: unknown): Promise<CloserActionResult> {
  const parsed = PrepareCloserCommercialDocumentsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  try {
    const generated = await generateLeadStudyPdf(parsed.data.leadId, {
      workflowId: parsed.data.workflowId,
    });
    if (!generated.ok) {
      const detail =
        generated.missing?.length && generated.missing.length > 0
          ? `${generated.error} (${generated.missing.join(", ")})`
          : generated.error;
      return { ok: false, message: detail };
    }

    revalidateCloserPaths(parsed.data.workflowId, parsed.data.leadId);
    revalidatePath("/leads");
    revalidatePath("/confirmateur");
    return { ok: true, workflowId: parsed.data.workflowId };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function createCloserFollowUp(input: unknown): Promise<CloserActionResult> {
  const parsed = CloserFollowUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  try {
    const supabase = await createClient();
    const workflow = await getWorkflowSnapshot(parsed.data.workflowId);
    await saveWorkflowQualificationDraft(supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: access.userId,
      qualificationDataJson: mergeCloserJson(workflow.qualification_data_json, {
        next_follow_up_at: parsed.data.next_follow_up_at,
      }),
    });
    await appendWorkflowEvent({
      workflowId: parsed.data.workflowId,
      eventType: "closer_follow_up_planned",
      eventLabel: "Relance programmée",
      payloadJson: {
        next_follow_up_at: parsed.data.next_follow_up_at,
        comment: parsed.data.comment,
      },
    });
    revalidateCloserPaths(parsed.data.workflowId, workflow.lead_id);
    return { ok: true, workflowId: parsed.data.workflowId };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}
