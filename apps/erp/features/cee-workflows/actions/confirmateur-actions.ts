"use server";

import { revalidatePath } from "next/cache";

import { maybeAutoAssignAfterHandoff } from "@/features/automation/services/workflow-assignment-service";
import { canTransmitToCloser } from "@/features/cee-workflows/lib/confirmateur-handoff";
import {
  getConfirmateurHandoffLeadGaps,
} from "@/features/cee-workflows/lib/confirmateur-lead-completeness";
import {
  qualifyWorkflow as qualifyWorkflowInService,
  saveWorkflowQualificationDraft,
  sendToCloser as sendToCloserInService,
} from "@/features/cee-workflows/services/workflow-service";
import {
  SaveConfirmateurQualificationSchema,
  SendConfirmateurToCloserSchema,
} from "@/features/cee-workflows/schemas/confirmateur-workspace.schema";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";
import type { LeadRow } from "@/features/leads/types";
import type { Json } from "@/types/database.types";

type ConfirmateurActionResult =
  | { ok: true; workflowId: string }
  | { ok: false; message: string };

function revalidateConfirmateurPaths(workflowId: string, leadId?: string) {
  revalidatePath("/confirmateur");
  revalidatePath(`/confirmateur/${workflowId}`);
  if (leadId) {
    revalidatePath(`/leads/${leadId}`);
  }
  revalidatePath("/leads");
}

async function getWorkflowSnapshot(supabase: Awaited<ReturnType<typeof createClient>>, workflowId: string) {
  const { data, error } = await supabase
    .from("lead_sheet_workflows")
    .select("id, lead_id, workflow_status, presentation_document_id, agreement_document_id, quote_document_id, qualification_data_json")
    .eq("id", workflowId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Workflow introuvable.");
  }
  return data;
}

function qualificationToJson(qualification: Record<string, unknown>): Json {
  return qualification as Json;
}

export async function saveConfirmateurQualification(input: unknown): Promise<ConfirmateurActionResult> {
  const parsed = SaveConfirmateurQualificationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }
  try {
    const supabase = await createClient();
    const workflow = await saveWorkflowQualificationDraft(supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: access.userId,
      qualificationDataJson: qualificationToJson(parsed.data.qualification),
    });
    revalidateConfirmateurPaths(workflow.id, workflow.lead_id);
    return { ok: true, workflowId: workflow.id };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function markConfirmateurWorkflowQualified(input: unknown): Promise<ConfirmateurActionResult> {
  const parsed = SaveConfirmateurQualificationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }
  try {
    const supabase = await createClient();
    const workflow = await qualifyWorkflowInService(supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: access.userId,
      qualificationDataJson: qualificationToJson(parsed.data.qualification),
    });
    revalidateConfirmateurPaths(workflow.id, workflow.lead_id);
    return { ok: true, workflowId: workflow.id };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function sendConfirmateurWorkflowToCloser(
  input: unknown,
): Promise<ConfirmateurActionResult> {
  const parsed = SendConfirmateurToCloserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  try {
    const supabase = await createClient();
    const snapshot = await getWorkflowSnapshot(supabase, parsed.data.workflowId);
    const qualification = parsed.data.qualification as Record<string, unknown>;

    await saveWorkflowQualificationDraft(supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: access.userId,
      qualificationDataJson: qualificationToJson(parsed.data.qualification),
    });

    if (
      !canTransmitToCloser({
        dossier_complet: qualification.dossier_complet === true,
        coherence_simulation: qualification.coherence_simulation === true,
        technical_feasibility: qualification.technical_feasibility === true,
      })
    ) {
      throw new Error("Qualification incomplète : dossier, cohérence simulation et faisabilité doivent être validés.");
    }

    const { data: leadRow, error: leadFetchError } = await supabase
      .from("leads")
      .select(
        "company_name, civility, first_name, last_name, contact_name, email, phone, contact_role, job_title, head_office_address, head_office_siret, siret, head_office_postal_code, head_office_city, worksite_address, worksite_siret, worksite_postal_code, worksite_city, aerial_photos, cadastral_parcel_files, study_media_files, recording_files",
      )
      .eq("id", snapshot.lead_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (leadFetchError || !leadRow) {
      throw new Error(leadFetchError?.message ?? "Lead introuvable.");
    }

    const leadGaps = getConfirmateurHandoffLeadGaps(leadRow as LeadRow);
    if (leadGaps.length > 0) {
      throw new Error(
        `Transmission impossible : complétez le dossier lead (médias, contact, adresses, enregistrement). Manque : ${leadGaps.join(" · ")}`,
      );
    }

    let workflow = await sendToCloserInService(supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: access.userId,
      assignedCloserUserId: parsed.data.assignedCloserUserId,
      closerNotes:
        typeof qualification.closer_handover_notes === "string" ? qualification.closer_handover_notes : null,
    });
    workflow = await maybeAutoAssignAfterHandoff(supabase, workflow, "closer", access.userId);

    revalidatePath("/closer");
    revalidateConfirmateurPaths(workflow.id, workflow.lead_id);
    return { ok: true, workflowId: workflow.id };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}
