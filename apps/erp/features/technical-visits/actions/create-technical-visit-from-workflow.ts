"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  appendWorkflowEvent,
  linkTechnicalVisitToWorkflow,
} from "@/features/cee-workflows/services/workflow-service";
import { leadAddressesComplete } from "@/features/leads/lib/lead-address-validation";
import { fetchLeadInternalNotesPlainBlock } from "@/features/leads/lib/lead-internal-notes-export";
import { buildTechnicalVisitDefaultsFromLead } from "@/features/leads/lib/lead-to-technical-visit";
import { ACTIVE_TECHNICAL_VISIT_STATUSES } from "@/features/leads/constants/technical-visit-active-statuses";
import type { LeadRow } from "@/features/leads/types";
import { geocodeWorksiteForSave } from "@/features/technical-visits/lib/geocode-worksite-for-save";
import { insertFromTechnicalVisitForm } from "@/features/technical-visits/lib/map-to-db";
import { CEE_SHEET_WORKFLOW_EMBED } from "@/features/cee-workflows/queries/cee-sheet-workflow-embed";
import {
  resolveVisitTemplateForCeeSheetAsync,
  type CeeSheetForVisitTemplateResolution,
} from "@/features/technical-visits/workflow/cee-sheet-to-visit-template";
import {
  canAdvanceWorkflowToTechnicalVisitPending,
  parseWorkflowStatusForTransitions,
} from "@/features/technical-visits/workflow/workflow-technical-visit-eligibility";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { getRestrictedAgentLeadEditBlockReason } from "@/lib/auth/restricted-agent-lead-edit";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

const CreateTechnicalVisitFromWorkflowSchema = z.object({
  workflowId: z.string().uuid(),
  technicianId: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() ? s.trim() : undefined))
    .pipe(z.string().uuid().optional()),
});

export type CreateTechnicalVisitFromWorkflowResult =
  | { ok: true; technicalVisitId: string; warnings?: string[] }
  | { ok: false; message: string; existingTechnicalVisitId?: string };

/** Logs temporaires : code stable pour corréler avec le message affiché (retirer après diagnostic). */
function logCreateVtWorkflow(code: string, detail: Record<string, unknown> = {}) {
  console.info("[CREATE-VT-WORKFLOW-DEBUG]", { code, ...detail });
}

/**
 * Crée une visite technique **dynamique** rattachée à un `lead_sheet_workflows` :
 * snapshot de template, `form_answers_json` vide, `workflow_id` posé, puis enchaînement
 * métier (`linkTechnicalVisitToWorkflow`) si le pipeline le permet.
 */
export async function createTechnicalVisitFromWorkflow(
  input: unknown,
): Promise<CreateTechnicalVisitFromWorkflowResult> {
  const parsed = CreateTechnicalVisitFromWorkflowSchema.safeParse(input);
  if (!parsed.success) {
    logCreateVtWorkflow("invalid_input");
    return { ok: false, message: "Données invalides." };
  }

  const { workflowId, technicianId } = parsed.data;

  const supabase = await createClient();
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    logCreateVtWorkflow("not_authenticated");
    return { ok: false, message: "Non authentifié." };
  }

  const { data: wfRow, error: wfError } = await supabase
    .from("lead_sheet_workflows")
    .select("id, lead_id, cee_sheet_id, workflow_status, is_archived")
    .eq("id", workflowId)
    .maybeSingle();

  if (wfError) {
    logCreateVtWorkflow("workflow_query_error", { message: wfError.message, workflowId });
    return { ok: false, message: wfError.message };
  }
  if (!wfRow) {
    logCreateVtWorkflow("workflow_not_found", { workflowId });
    return { ok: false, message: "Workflow introuvable." };
  }

  if (wfRow.is_archived) {
    logCreateVtWorkflow("workflow_archived", { workflowId });
    return { ok: false, message: "Ce workflow est archivé : création de visite impossible." };
  }

  let sheet: (CeeSheetForVisitTemplateResolution & { id: string }) | null = null;
  if (wfRow.cee_sheet_id) {
    const { data: sheetRow, error: sheetError } = await supabase
      .from("cee_sheets")
      .select(CEE_SHEET_WORKFLOW_EMBED)
      .eq("id", wfRow.cee_sheet_id)
      .maybeSingle();
    if (sheetError) {
      logCreateVtWorkflow("cee_sheet_query_error", {
        message: sheetError.message,
        workflowId,
        cee_sheet_id: wfRow.cee_sheet_id,
      });
      return { ok: false, message: sheetError.message };
    }
    sheet = sheetRow;
  }

  const resolved = await resolveVisitTemplateForCeeSheetAsync(supabase, sheet);
  if (!resolved) {
    const code = sheet?.code?.trim() || "—";
    logCreateVtWorkflow("no_template_for_sheet", { workflowId, sheet_code: code });
    return {
      ok: false,
      message: `Aucun formulaire de visite dynamique n’est configuré pour la fiche CEE « ${code} ».`,
    };
  }

  const wfStatus = parseWorkflowStatusForTransitions(wfRow.workflow_status);
  if (!wfStatus || !canAdvanceWorkflowToTechnicalVisitPending(wfStatus)) {
    logCreateVtWorkflow("workflow_status_blocks_visit", {
      workflowId,
      workflow_status: wfRow.workflow_status,
    });
    return {
      ok: false,
      message: `Le statut du workflow (« ${wfRow.workflow_status} ») ne permet pas encore de créer la visite technique. Faites progresser le dossier (ex. qualification) puis réessayez.`,
    };
  }

  const { data: existingForWorkflow, error: exWfError } = await supabase
    .from("technical_visits")
    .select("id")
    .eq("workflow_id", workflowId)
    .is("deleted_at", null)
    .in("status", [...ACTIVE_TECHNICAL_VISIT_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (exWfError) {
    logCreateVtWorkflow("existing_vt_query_error", { message: exWfError.message, workflowId });
    return { ok: false, message: exWfError.message };
  }
  if (existingForWorkflow?.id) {
    logCreateVtWorkflow("existing_active_for_workflow", {
      workflowId,
      existingTechnicalVisitId: existingForWorkflow.id,
    });
    return {
      ok: false,
      message: "Une visite technique active est déjà rattachée à ce workflow.",
      existingTechnicalVisitId: existingForWorkflow.id,
    };
  }

  const leadId = wfRow.lead_id as string;

  const { data: leadRow, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (leadError) {
    logCreateVtWorkflow("lead_query_error", { message: leadError.message, leadId });
    return { ok: false, message: leadError.message };
  }
  if (!leadRow) {
    logCreateVtWorkflow("lead_not_found", { leadId });
    return { ok: false, message: "Lead introuvable ou supprimé." };
  }

  const leadAccessRow = {
    created_by_agent_id: leadRow.created_by_agent_id as string | null,
    confirmed_by_user_id: leadRow.confirmed_by_user_id as string | null,
  };
  if (!canAccessLeadRow(leadAccessRow, access)) {
    logCreateVtWorkflow("lead_access_denied", { leadId });
    return { ok: false, message: "Accès refusé à ce lead." };
  }

  const agentBlock = await getRestrictedAgentLeadEditBlockReason(supabase, access, leadId);
  if (agentBlock) {
    logCreateVtWorkflow("restricted_agent_block", { leadId, agentBlock });
    return { ok: false, message: agentBlock };
  }

  const lead = leadRow as unknown as LeadRow;

  if (lead.lead_status === "lost" || lead.lead_status === "converted") {
    logCreateVtWorkflow("lead_terminal_status", { leadId, lead_status: lead.lead_status });
    return {
      ok: false,
      message: "Ce lead est en statut terminal (perdu ou converti) : création de visite technique impossible.",
    };
  }

  if (!lead.company_name?.trim()) {
    logCreateVtWorkflow("lead_company_name_required", { leadId });
    return { ok: false, message: "Le nom de la société est obligatoire." };
  }

  if (!leadAddressesComplete(lead)) {
    logCreateVtWorkflow("lead_addresses_incomplete", { leadId });
    return {
      ok: false,
      message:
        "Complétez les six champs d’adresse (siège et travaux : adresse, code postal, ville) avant de créer la visite.",
    };
  }

  const { data: leadActiveList, error: leadActiveError } = await supabase
    .from("technical_visits")
    .select("id, workflow_id")
    .eq("lead_id", leadId)
    .is("deleted_at", null)
    .in("status", [...ACTIVE_TECHNICAL_VISIT_STATUSES]);

  if (leadActiveError) {
    logCreateVtWorkflow("lead_active_vt_query_error", { message: leadActiveError.message, leadId });
    return { ok: false, message: leadActiveError.message };
  }

  const warnings: string[] = [];
  const otherActiveOnLead = (leadActiveList ?? []).filter((r) => r.workflow_id !== workflowId);
  if (otherActiveOnLead.length > 0) {
    warnings.push(
      otherActiveOnLead.length === 1
        ? "Une autre visite technique active existe déjà sur ce lead (autre opération CEE ou visite sans workflow). Vous pouvez poursuivre : l’unicité reste garantie par workflow."
        : `${otherActiveOnLead.length} autres visites techniques actives sur ce lead (autres dossiers CEE ou sans workflow). Vous pouvez poursuivre : l’unicité reste garantie par workflow.`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    logCreateVtWorkflow("session_expired", { workflowId, leadId });
    return { ok: false, message: "Session expirée." };
  }

  const internalNotesBlock = await fetchLeadInternalNotesPlainBlock(supabase, leadId);
  const defaults = buildTechnicalVisitDefaultsFromLead(lead, { internalNotesBlock });
  const insertRow = insertFromTechnicalVisitForm(defaults);
  insertRow.created_by_user_id = user.id;
  insertRow.workflow_id = workflowId;
  insertRow.visit_template_key = resolved.templateKey;
  insertRow.visit_template_version = resolved.version;
  insertRow.visit_schema_snapshot_json = resolved.visitSchemaSnapshotJson;
  insertRow.form_answers_json = {} as Json;
  if (technicianId) {
    insertRow.technician_id = technicianId;
  }

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
    if (insertError.code === "23505") {
      logCreateVtWorkflow("insert_unique_violation", { workflowId });
      return {
        ok: false,
        message: "Une visite technique active existe déjà pour ce workflow (conflit d’unicité).",
      };
    }
    logCreateVtWorkflow("insert_error", { workflowId, message: insertError.message, code: insertError.code });
    return { ok: false, message: insertError.message };
  }

  if (!vt?.id) {
    logCreateVtWorkflow("insert_no_row_returned", { workflowId });
    return { ok: false, message: "Aucune donnée retournée après création de la visite." };
  }

  try {
    await linkTechnicalVisitToWorkflow(supabase, {
      workflowId,
      technicalVisitId: vt.id,
      actorUserId: user.id,
      markDone: false,
    });
  } catch (e) {
    await supabase.from("technical_visits").update({ deleted_at: new Date().toISOString() }).eq("id", vt.id);
    const msg = e instanceof Error ? e.message : "Échec du rattachement workflow.";
    logCreateVtWorkflow("link_workflow_failed", { workflowId, technicalVisitId: vt.id, message: msg });
    return { ok: false, message: msg };
  }

  try {
    await appendWorkflowEvent(supabase, {
      workflowId,
      eventType: "dynamic_technical_visit_created",
      eventLabel: "Visite technique dynamique créée depuis le workflow",
      payloadJson: {
        origin: "workflow",
        workflow_id: workflowId,
        technical_visit_id: vt.id,
        template_key: resolved.templateKey,
        template_version: resolved.version,
      } as Json,
      createdByUserId: user.id,
    });
  } catch {
    warnings.push(
      "La visite a été créée mais l’événement d’audit sur le workflow n’a pas pu être enregistré (réessayer ou contacter le support).",
    );
  }

  revalidatePath("/technical-visits");
  revalidatePath(`/technical-visits/${vt.id}`);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/confirmateur");
  revalidatePath(`/confirmateur/${workflowId}`);

  return {
    ok: true,
    technicalVisitId: vt.id,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
