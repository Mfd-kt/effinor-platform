import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CEE_WORKFLOW_STATUS_VALUES,
  DEFAULT_WORKFLOW_STATUS,
  type CeeWorkflowStatus,
} from "@/features/cee-workflows/domain/constants";
import { buildWorkflowEventInsert } from "@/features/cee-workflows/domain/events";
import { assertCommercialSheetIsActive } from "@/features/cee-workflows/domain/sheet";
import { assertWorkflowTransition } from "@/features/cee-workflows/domain/transitions";
import { prefillWorkflowAssignments } from "@/features/cee-workflows/services/team-service";
import { appendWorkflowStructuredLogs, logWorkflowCreated } from "@/features/cee-workflows/services/workflow-event-log";
import type {
  CeeSheetWorkflowEventRow,
  CeeSheetWorkflowRow,
  CeeSheetWorkflowUpdate,
  WorkflowAssignmentPatch,
  WorkflowDocumentsPatch,
  WorkflowEventInput,
  WorkflowSimulationPayload,
} from "@/features/cee-workflows/types";
import { sendSlackAutomationTypedEvent, buildAbsoluteLeadUrl } from "@/features/notifications/services/slack-automation-event-send";
import type { Database, Json } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

type WorkflowCompatibilityPatch = {
  leadStatus?: Database["public"]["Enums"]["lead_status"];
  qualificationStatus?: Database["public"]["Enums"]["qualification_status"];
  assignedTo?: string | null;
  confirmedByUserId?: string | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

type JsonObject = { [key: string]: Json | undefined };

function ensureObjectJson(value: Json | null | undefined): JsonObject {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }
  return value as JsonObject;
}

function mergeJsonObject(base: Json | null | undefined, patch: Json | null | undefined): Json {
  return {
    ...ensureObjectJson(base),
    ...ensureObjectJson(patch),
  };
}

function carriedWorkflowStatus(prev: CeeSheetWorkflowRow | null): CeeWorkflowStatus {
  const s = prev?.workflow_status;
  if (s && (CEE_WORKFLOW_STATUS_VALUES as readonly string[]).includes(s)) {
    return s as CeeWorkflowStatus;
  }
  return DEFAULT_WORKFLOW_STATUS;
}

type WorkflowDocumentCarryover = Pick<
  Database["public"]["Tables"]["lead_sheet_workflows"]["Insert"],
  | "presentation_document_id"
  | "agreement_document_id"
  | "quote_document_id"
  | "agreement_signature_status"
  | "agreement_signature_provider"
  | "agreement_signature_request_id"
  | "agreement_sent_at"
  | "agreement_signed_at"
  | "closer_notes"
>;

function documentFieldsCarryoverFromPrev(prev: CeeSheetWorkflowRow | null): WorkflowDocumentCarryover {
  if (!prev) {
    return {};
  }
  return {
    presentation_document_id: prev.presentation_document_id,
    agreement_document_id: prev.agreement_document_id,
    quote_document_id: prev.quote_document_id,
    agreement_signature_status: prev.agreement_signature_status,
    agreement_signature_provider: prev.agreement_signature_provider,
    agreement_signature_request_id: prev.agreement_signature_request_id,
    agreement_sent_at: prev.agreement_sent_at,
    agreement_signed_at: prev.agreement_signed_at,
    closer_notes: prev.closer_notes,
  };
}

async function deleteOtherLeadSheetWorkflowsForLead(
  cleanupClient: Supabase,
  leadId: string,
  keepWorkflowId: string,
): Promise<void> {
  const { data: stale, error: selErr } = await cleanupClient
    .from("lead_sheet_workflows")
    .select("id")
    .eq("lead_id", leadId)
    .neq("id", keepWorkflowId);

  if (selErr) {
    throw new Error(selErr.message);
  }

  const staleIds = stale?.map((r) => r.id) ?? [];
  if (staleIds.length > 0) {
    const { error: tvErr } = await cleanupClient
      .from("technical_visits")
      .update({ workflow_id: keepWorkflowId })
      .eq("lead_id", leadId)
      .in("workflow_id", staleIds);
    if (tvErr) {
      throw new Error(tvErr.message);
    }
    const { error: pcErr } = await cleanupClient
      .from("project_carts")
      .update({ workflow_id: keepWorkflowId })
      .eq("lead_id", leadId)
      .in("workflow_id", staleIds);
    if (pcErr) {
      throw new Error(pcErr.message);
    }
  }

  const { error: delErr } = await cleanupClient
    .from("lead_sheet_workflows")
    .delete()
    .eq("lead_id", leadId)
    .neq("id", keepWorkflowId);

  if (delErr) {
    throw new Error(delErr.message);
  }
}

async function getWorkflowOrThrow(supabase: Supabase, workflowId: string): Promise<CeeSheetWorkflowRow> {
  const { data, error } = await supabase
    .from("lead_sheet_workflows")
    .select("*")
    .eq("id", workflowId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Workflow introuvable.");
  }

  return data;
}

async function getLeadOrThrow(
  supabase: Supabase,
  leadId: string,
): Promise<Pick<Database["public"]["Tables"]["leads"]["Row"], "id" | "cee_sheet_id" | "current_workflow_id">> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, cee_sheet_id, current_workflow_id")
    .eq("id", leadId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Lead introuvable.");
  }

  return data;
}

async function getCeeSheetOrThrow(
  supabase: Supabase,
  ceeSheetId: string,
): Promise<Pick<Database["public"]["Tables"]["cee_sheets"]["Row"], "id" | "code" | "label" | "is_commercial_active">> {
  const { data, error } = await supabase
    .from("cee_sheets")
    .select("id, code, label, is_commercial_active")
    .eq("id", ceeSheetId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Fiche CEE introuvable.");
  }

  assertCommercialSheetIsActive(data);

  return data;
}

async function updateLeadCompatibility(
  supabase: Supabase,
  leadId: string,
  workflowId: string,
  ceeSheetId: string,
  patch: WorkflowCompatibilityPatch = {},
): Promise<void> {
  const leadPatch: Database["public"]["Tables"]["leads"]["Update"] = {
    current_workflow_id: workflowId,
    cee_sheet_id: ceeSheetId,
  };

  if (patch.leadStatus !== undefined) {
    leadPatch.lead_status = patch.leadStatus;
  }
  if (patch.qualificationStatus !== undefined) {
    leadPatch.qualification_status = patch.qualificationStatus;
  }
  if (patch.assignedTo !== undefined) {
    leadPatch.assigned_to = patch.assignedTo;
  }
  if (patch.confirmedByUserId !== undefined) {
    leadPatch.confirmed_by_user_id = patch.confirmedByUserId;
  }

  const { error } = await supabase.from("leads").update(leadPatch).eq("id", leadId);
  if (error) {
    throw new Error(error.message);
  }
}

async function insertNotificationLog(
  supabase: Supabase,
  input: {
    eventType: string;
    entityId: string;
    payloadJson?: Json;
  },
): Promise<void> {
  await supabase.from("notification_logs").insert({
    channel: "workflow",
    provider: "app",
    status: "sent",
    event_type: input.eventType,
    entity_type: "lead_sheet_workflow",
    entity_id: input.entityId,
    payload_json: input.payloadJson ?? {},
  });
}

export async function appendWorkflowEvent(
  supabase: Supabase,
  input: WorkflowEventInput,
): Promise<CeeSheetWorkflowEventRow> {
  const { data, error } = await supabase
    .from("lead_sheet_workflow_events")
    .insert(buildWorkflowEventInsert(input))
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible d'écrire l'événement workflow.");
  }

  return data;
}

async function updateWorkflowAndAppendEvent(
  supabase: Supabase,
  workflow: CeeSheetWorkflowRow,
  patch: CeeSheetWorkflowUpdate,
  event: Omit<WorkflowEventInput, "workflowId">,
): Promise<CeeSheetWorkflowRow> {
  const { data, error } = await supabase
    .from("lead_sheet_workflows")
    .update(patch)
    .eq("id", workflow.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de mettre à jour le workflow.");
  }

  await appendWorkflowEvent(supabase, {
    workflowId: workflow.id,
    ...event,
  });

  await appendWorkflowStructuredLogs(supabase, workflow, data, patch, event);

  return data;
}

export async function createLeadSheetWorkflow(
  supabase: Supabase,
  input: {
    leadId: string;
    ceeSheetId: string;
    actorUserId?: string | null;
    workflowStatus?: CeeWorkflowStatus;
    simulationInputJson?: Json;
    simulationResultJson?: Json;
    qualificationDataJson?: Json;
    assignmentPatch?: WorkflowAssignmentPatch;
    /** Reprise documents / signature / notes closer depuis un workflow précédent (changement de fiche). */
    documentCarryover?: WorkflowDocumentCarryover;
  },
): Promise<CeeSheetWorkflowRow> {
  await getLeadOrThrow(supabase, input.leadId);
  const sheet = await getCeeSheetOrThrow(supabase, input.ceeSheetId);

  const { data: existing, error: existingError } = await supabase
    .from("lead_sheet_workflows")
    .select("*")
    .eq("lead_id", input.leadId)
    .eq("cee_sheet_id", input.ceeSheetId)
    .eq("is_archived", false)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    await updateLeadCompatibility(supabase, existing.lead_id, existing.id, existing.cee_sheet_id);
    return existing;
  }

  const defaults = await prefillWorkflowAssignments(supabase, input.ceeSheetId);
  const assignmentPatch = input.assignmentPatch ?? {};

  const { data, error } = await supabase
    .from("lead_sheet_workflows")
    .insert({
      lead_id: input.leadId,
      cee_sheet_id: input.ceeSheetId,
      cee_sheet_team_id: assignmentPatch.ceeSheetTeamId ?? defaults.ceeSheetTeamId,
      workflow_status: input.workflowStatus ?? DEFAULT_WORKFLOW_STATUS,
      assigned_agent_user_id: assignmentPatch.assignedAgentUserId ?? defaults.assignedAgentUserId,
      assigned_confirmateur_user_id:
        assignmentPatch.assignedConfirmateurUserId ?? defaults.assignedConfirmateurUserId,
      assigned_closer_user_id: assignmentPatch.assignedCloserUserId ?? defaults.assignedCloserUserId,
      simulation_input_json: ensureObjectJson(input.simulationInputJson),
      simulation_result_json: ensureObjectJson(input.simulationResultJson),
      qualification_data_json: ensureObjectJson(input.qualificationDataJson),
      ...(input.documentCarryover ?? {}),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de créer le workflow.");
  }

  await updateLeadCompatibility(supabase, input.leadId, data.id, input.ceeSheetId, {
    assignedTo: data.assigned_agent_user_id,
  });

  await appendWorkflowEvent(supabase, {
    workflowId: data.id,
    eventType: "workflow_created",
    eventLabel: `Workflow créé pour la fiche ${sheet.code}`,
    payloadJson: {
      cee_sheet_id: sheet.id,
      cee_sheet_code: sheet.code,
      cee_sheet_label: sheet.label,
    },
    createdByUserId: input.actorUserId ?? null,
  });

  await logWorkflowCreated(supabase, { workflow: data, actorUserId: input.actorUserId ?? null });

  return data;
}

/**
 * Bascule le lead sur une **nouvelle fiche CEE** : crée un workflow sur la fiche cible en **reprendant**
 * simulateur, qualification, documents de signature et affectations (si demandé), puis **supprime** tous les
 * autres `lead_sheet_workflows` du même lead pour éviter les doublons de tunnel. Le dossier `leads` (notes,
 * e-mails, champs simulateur sur la ligne lead, etc.) reste **le même enregistrement**.
 *
 * `workflowCleanupClient` : en général client `service_role` (contrôle métier côté action), car la RLS ne
 * permet pas à tous les profils habilités au changement de fiche de supprimer des workflows.
 */
export async function switchLeadToCeeSheetWorkflow(
  supabase: Supabase,
  input: {
    leadId: string;
    newCeeSheetId: string;
    actorUserId?: string | null;
    copyRoleAssignments?: boolean;
  },
  opts?: {
    workflowCleanupClient?: Supabase;
  },
): Promise<CeeSheetWorkflowRow> {
  const lead = await getLeadOrThrow(supabase, input.leadId);

  const { data: newSheet, error: newSheetErr } = await supabase
    .from("cee_sheets")
    .select("id, code, label, simulator_key, workflow_key, is_commercial_active")
    .eq("id", input.newCeeSheetId)
    .is("deleted_at", null)
    .single();

  if (newSheetErr || !newSheet) {
    throw new Error(newSheetErr?.message ?? "Fiche CEE introuvable.");
  }
  assertCommercialSheetIsActive(newSheet);

  const { data: activeList, error: listErr } = await supabase
    .from("lead_sheet_workflows")
    .select("*")
    .eq("lead_id", input.leadId)
    .eq("is_archived", false);

  if (listErr) {
    throw new Error(listErr.message);
  }

  const active = activeList ?? [];
  if (active.some((w) => w.cee_sheet_id === input.newCeeSheetId)) {
    throw new Error("Un workflow actif existe déjà pour cette fiche CEE.");
  }

  const copyRoles = input.copyRoleAssignments !== false;
  let prev: CeeSheetWorkflowRow | null = null;
  if (active.length > 0) {
    prev =
      (lead.current_workflow_id ? active.find((w) => w.id === lead.current_workflow_id) : null) ??
      active[0] ??
      null;
  } else if (lead.current_workflow_id) {
    const { data: archivedRef } = await supabase
      .from("lead_sheet_workflows")
      .select("*")
      .eq("id", lead.current_workflow_id)
      .maybeSingle();
    prev = archivedRef ?? null;
  }

  let assignmentPatch: WorkflowAssignmentPatch | undefined;
  if (copyRoles && prev) {
    assignmentPatch = {
      assignedAgentUserId: prev.assigned_agent_user_id,
      assignedConfirmateurUserId: prev.assigned_confirmateur_user_id,
      assignedCloserUserId: prev.assigned_closer_user_id,
    };
  }

  const created = await createLeadSheetWorkflow(supabase, {
    leadId: input.leadId,
    ceeSheetId: input.newCeeSheetId,
    workflowStatus: carriedWorkflowStatus(prev),
    simulationInputJson: prev?.simulation_input_json,
    simulationResultJson: prev?.simulation_result_json,
    qualificationDataJson: prev?.qualification_data_json,
    documentCarryover: documentFieldsCarryoverFromPrev(prev),
    assignmentPatch,
    actorUserId: input.actorUserId,
  });

  const cleanupClient = opts?.workflowCleanupClient ?? supabase;
  await deleteOtherLeadSheetWorkflowsForLead(cleanupClient, input.leadId, created.id);

  return created;
}

export async function assignWorkflowUsers(
  supabase: Supabase,
  input: {
    workflowId: string;
    actorUserId?: string | null;
    ceeSheetTeamId?: string | null;
    assignedAgentUserId?: string | null;
    assignedConfirmateurUserId?: string | null;
    assignedCloserUserId?: string | null;
  },
): Promise<CeeSheetWorkflowRow> {
  const workflow = await getWorkflowOrThrow(supabase, input.workflowId);
  const updated = await updateWorkflowAndAppendEvent(
    supabase,
    workflow,
    {
      cee_sheet_team_id: input.ceeSheetTeamId ?? workflow.cee_sheet_team_id,
      assigned_agent_user_id:
        input.assignedAgentUserId !== undefined
          ? input.assignedAgentUserId
          : workflow.assigned_agent_user_id,
      assigned_confirmateur_user_id:
        input.assignedConfirmateurUserId !== undefined
          ? input.assignedConfirmateurUserId
          : workflow.assigned_confirmateur_user_id,
      assigned_closer_user_id:
        input.assignedCloserUserId !== undefined
          ? input.assignedCloserUserId
          : workflow.assigned_closer_user_id,
    },
    {
      eventType: "assignments_updated",
      eventLabel: "Affectations du workflow mises à jour",
      payloadJson: {
        cee_sheet_team_id: input.ceeSheetTeamId ?? workflow.cee_sheet_team_id,
        assigned_agent_user_id:
          input.assignedAgentUserId !== undefined
            ? input.assignedAgentUserId
            : workflow.assigned_agent_user_id,
        assigned_confirmateur_user_id:
          input.assignedConfirmateurUserId !== undefined
            ? input.assignedConfirmateurUserId
            : workflow.assigned_confirmateur_user_id,
        assigned_closer_user_id:
          input.assignedCloserUserId !== undefined
            ? input.assignedCloserUserId
            : workflow.assigned_closer_user_id,
      },
      createdByUserId: input.actorUserId ?? null,
    },
  );

  await updateLeadCompatibility(supabase, updated.lead_id, updated.id, updated.cee_sheet_id, {
    assignedTo: updated.assigned_agent_user_id,
    confirmedByUserId: updated.assigned_confirmateur_user_id,
  });

  return updated;
}

export async function completeSimulation(
  supabase: Supabase,
  input: {
    workflowId: string;
    actorUserId?: string | null;
    simulation: WorkflowSimulationPayload;
    workflowStatus?: CeeWorkflowStatus;
  },
): Promise<CeeSheetWorkflowRow> {
  const workflow = await getWorkflowOrThrow(supabase, input.workflowId);
  const nextStatus = input.workflowStatus ?? "simulation_done";
  assertWorkflowTransition(workflow.workflow_status as CeeWorkflowStatus, nextStatus);

  return updateWorkflowAndAppendEvent(
    supabase,
    workflow,
    {
      workflow_status: nextStatus,
      simulation_input_json: ensureObjectJson(input.simulation.simulationInputJson),
      simulation_result_json: ensureObjectJson(input.simulation.simulationResultJson),
    },
    {
      eventType: "simulation_completed",
      eventLabel: "Simulation complétée",
      payloadJson: {
        workflow_status: nextStatus,
      },
      createdByUserId: input.actorUserId ?? null,
    },
  );
}

export async function sendToConfirmateur(
  supabase: Supabase,
  input: {
    workflowId: string;
    actorUserId?: string | null;
    assignedConfirmateurUserId?: string | null;
  },
): Promise<CeeSheetWorkflowRow> {
  const workflow = await getWorkflowOrThrow(supabase, input.workflowId);
  const nextStatus: CeeWorkflowStatus = "to_confirm";
  assertWorkflowTransition(workflow.workflow_status as CeeWorkflowStatus, nextStatus);

  const updated = await updateWorkflowAndAppendEvent(
    supabase,
    workflow,
    {
      workflow_status: nextStatus,
      assigned_confirmateur_user_id:
        input.assignedConfirmateurUserId ?? workflow.assigned_confirmateur_user_id,
    },
    {
      eventType: "sent_to_confirmateur",
      eventLabel: "Workflow transmis au confirmateur",
      payloadJson: {
        assigned_confirmateur_user_id:
          input.assignedConfirmateurUserId ?? workflow.assigned_confirmateur_user_id,
      },
      createdByUserId: input.actorUserId ?? null,
    },
  );

  await insertNotificationLog(supabase, {
    entityId: updated.id,
    eventType: "workflow.sent_to_confirmateur",
    payloadJson: { assigned_confirmateur_user_id: updated.assigned_confirmateur_user_id },
  });

  const { data: leadBrief } = await supabase
    .from("leads")
    .select("company_name")
    .eq("id", updated.lead_id)
    .maybeSingle();

  void sendSlackAutomationTypedEvent(
    "send_to_confirmateur",
    {
      companyName: leadBrief?.company_name ?? null,
      actionRequired: "Nouveau dossier transmis — à prendre en charge.",
      erpUrl: buildAbsoluteLeadUrl(updated.lead_id),
    },
    { workflowId: updated.id, leadId: updated.lead_id },
  ).catch((e) => console.warn("[workflow] Slack send_to_confirmateur:", e));

  return updated;
}

export async function qualifyWorkflow(
  supabase: Supabase,
  input: {
    workflowId: string;
    actorUserId?: string | null;
    qualificationDataJson: Json;
  },
): Promise<CeeSheetWorkflowRow> {
  const workflow = await getWorkflowOrThrow(supabase, input.workflowId);
  const nextStatus: CeeWorkflowStatus = "qualified";
  assertWorkflowTransition(workflow.workflow_status as CeeWorkflowStatus, nextStatus);

  const updated = await updateWorkflowAndAppendEvent(
    supabase,
    workflow,
    {
      workflow_status: nextStatus,
      qualification_data_json: mergeJsonObject(workflow.qualification_data_json, input.qualificationDataJson),
    },
    {
      eventType: "workflow_qualified",
      eventLabel: "Workflow qualifié",
      payloadJson: ensureObjectJson(input.qualificationDataJson),
      createdByUserId: input.actorUserId ?? null,
    },
  );

  await updateLeadCompatibility(supabase, updated.lead_id, updated.id, updated.cee_sheet_id, {
    qualificationStatus: "qualified",
    confirmedByUserId: input.actorUserId ?? updated.assigned_confirmateur_user_id,
  });

  return updated;
}

export async function saveWorkflowQualificationDraft(
  supabase: Supabase,
  input: {
    workflowId: string;
    actorUserId?: string | null;
    qualificationDataJson: Json;
  },
): Promise<CeeSheetWorkflowRow> {
  const workflow = await getWorkflowOrThrow(supabase, input.workflowId);

  return updateWorkflowAndAppendEvent(
    supabase,
    workflow,
    {
      qualification_data_json: mergeJsonObject(workflow.qualification_data_json, input.qualificationDataJson),
    },
    {
      eventType: "qualification_saved",
      eventLabel: "Qualification enregistrée",
      payloadJson: ensureObjectJson(input.qualificationDataJson),
      createdByUserId: input.actorUserId ?? null,
    },
  );
}

export async function prepareCommercialDocuments(
  supabase: Supabase,
  input: {
    workflowId: string;
    actorUserId?: string | null;
    documents: WorkflowDocumentsPatch;
  },
): Promise<CeeSheetWorkflowRow> {
  const workflow = await getWorkflowOrThrow(supabase, input.workflowId);
  const nextStatus: CeeWorkflowStatus = "docs_prepared";
  assertWorkflowTransition(workflow.workflow_status as CeeWorkflowStatus, nextStatus);

  return updateWorkflowAndAppendEvent(
    supabase,
    workflow,
    {
      workflow_status: nextStatus,
      presentation_document_id:
        input.documents.presentationDocumentId !== undefined
          ? input.documents.presentationDocumentId
          : workflow.presentation_document_id,
      agreement_document_id:
        input.documents.agreementDocumentId !== undefined
          ? input.documents.agreementDocumentId
          : workflow.agreement_document_id,
      quote_document_id:
        input.documents.quoteDocumentId !== undefined
          ? input.documents.quoteDocumentId
          : workflow.quote_document_id,
    },
    {
      eventType: "commercial_documents_prepared",
      eventLabel: "Documents commerciaux préparés",
      payloadJson: {
        presentation_document_id: input.documents.presentationDocumentId ?? workflow.presentation_document_id,
        agreement_document_id: input.documents.agreementDocumentId ?? workflow.agreement_document_id,
        quote_document_id: input.documents.quoteDocumentId ?? workflow.quote_document_id,
      },
      createdByUserId: input.actorUserId ?? null,
    },
  );
}

export async function sendToCloser(
  supabase: Supabase,
  input: {
    workflowId: string;
    actorUserId?: string | null;
    assignedCloserUserId?: string | null;
    closerNotes?: string | null;
  },
): Promise<CeeSheetWorkflowRow> {
  const workflow = await getWorkflowOrThrow(supabase, input.workflowId);
  const nextStatus: CeeWorkflowStatus = "to_close";
  assertWorkflowTransition(workflow.workflow_status as CeeWorkflowStatus, nextStatus);

  const updated = await updateWorkflowAndAppendEvent(
    supabase,
    workflow,
    {
      workflow_status: nextStatus,
      assigned_closer_user_id: input.assignedCloserUserId ?? workflow.assigned_closer_user_id,
      closer_notes: input.closerNotes !== undefined ? input.closerNotes : workflow.closer_notes,
    },
    {
      eventType: "sent_to_closer",
      eventLabel: "Workflow transmis au closer",
      payloadJson: {
        assigned_closer_user_id: input.assignedCloserUserId ?? workflow.assigned_closer_user_id,
        closer_notes: input.closerNotes ?? workflow.closer_notes,
      },
      createdByUserId: input.actorUserId ?? null,
    },
  );

  await insertNotificationLog(supabase, {
    entityId: updated.id,
    eventType: "workflow.sent_to_closer",
    payloadJson: { assigned_closer_user_id: updated.assigned_closer_user_id },
  });

  return updated;
}

export async function markAgreementSent(
  supabase: Supabase,
  input: {
    workflowId: string;
    actorUserId?: string | null;
    agreementDocumentId?: string | null;
    signatureProvider?: string | null;
    signatureRequestId?: string | null;
    signatureStatus?: string | null;
  },
): Promise<CeeSheetWorkflowRow> {
  const workflow = await getWorkflowOrThrow(supabase, input.workflowId);
  const nextStatus: CeeWorkflowStatus = "agreement_sent";
  assertWorkflowTransition(workflow.workflow_status as CeeWorkflowStatus, nextStatus);

  const updated = await updateWorkflowAndAppendEvent(
    supabase,
    workflow,
    {
      workflow_status: nextStatus,
      agreement_document_id:
        input.agreementDocumentId !== undefined
          ? input.agreementDocumentId
          : workflow.agreement_document_id,
      agreement_signature_provider:
        input.signatureProvider !== undefined
          ? input.signatureProvider
          : workflow.agreement_signature_provider,
      agreement_signature_request_id:
        input.signatureRequestId !== undefined
          ? input.signatureRequestId
          : workflow.agreement_signature_request_id,
      agreement_signature_status:
        input.signatureStatus !== undefined
          ? input.signatureStatus
          : workflow.agreement_signature_status,
      agreement_sent_at: nowIso(),
    },
    {
      eventType: "agreement_sent",
      eventLabel: "Accord commercial envoyé",
      payloadJson: {
        agreement_document_id: input.agreementDocumentId ?? workflow.agreement_document_id,
        agreement_signature_provider: input.signatureProvider ?? workflow.agreement_signature_provider,
        agreement_signature_request_id:
          input.signatureRequestId ?? workflow.agreement_signature_request_id,
      },
      createdByUserId: input.actorUserId ?? null,
    },
  );

  await updateLeadCompatibility(supabase, updated.lead_id, updated.id, updated.cee_sheet_id, {
    leadStatus: "dossier_sent",
  });

  await insertNotificationLog(supabase, {
    entityId: updated.id,
    eventType: "workflow.agreement_sent",
    payloadJson: { agreement_document_id: updated.agreement_document_id },
  });

  return updated;
}

export async function markAgreementSigned(
  supabase: Supabase,
  input: {
    workflowId: string;
    actorUserId?: string | null;
    signatureProvider?: string | null;
    signatureRequestId?: string | null;
    signatureStatus?: string | null;
  },
): Promise<CeeSheetWorkflowRow> {
  const workflow = await getWorkflowOrThrow(supabase, input.workflowId);
  const nextStatus: CeeWorkflowStatus = "agreement_signed";
  assertWorkflowTransition(workflow.workflow_status as CeeWorkflowStatus, nextStatus);

  const updated = await updateWorkflowAndAppendEvent(
    supabase,
    workflow,
    {
      workflow_status: nextStatus,
      agreement_signature_provider:
        input.signatureProvider !== undefined
          ? input.signatureProvider
          : workflow.agreement_signature_provider,
      agreement_signature_request_id:
        input.signatureRequestId !== undefined
          ? input.signatureRequestId
          : workflow.agreement_signature_request_id,
      agreement_signature_status: input.signatureStatus ?? "signed",
      agreement_signed_at: nowIso(),
    },
    {
      eventType: "agreement_signed",
      eventLabel: "Accord commercial signé",
      payloadJson: {
        agreement_signature_provider: input.signatureProvider ?? workflow.agreement_signature_provider,
        agreement_signature_request_id:
          input.signatureRequestId ?? workflow.agreement_signature_request_id,
      },
      createdByUserId: input.actorUserId ?? null,
    },
  );

  await updateLeadCompatibility(supabase, updated.lead_id, updated.id, updated.cee_sheet_id, {
    leadStatus: "accord_received",
  });

  return updated;
}

export async function markWorkflowLost(
  supabase: Supabase,
  input: {
    workflowId: string;
    actorUserId?: string | null;
    reason?: string | null;
    archive?: boolean;
  },
): Promise<CeeSheetWorkflowRow> {
  const workflow = await getWorkflowOrThrow(supabase, input.workflowId);
  const nextStatus: CeeWorkflowStatus = "lost";
  assertWorkflowTransition(workflow.workflow_status as CeeWorkflowStatus, nextStatus);

  const updated = await updateWorkflowAndAppendEvent(
    supabase,
    workflow,
    {
      workflow_status: nextStatus,
      is_archived: input.archive ?? workflow.is_archived,
      closer_notes: input.reason ?? workflow.closer_notes,
    },
    {
      eventType: "workflow_lost",
      eventLabel: "Workflow perdu",
      payloadJson: {
        reason: input.reason ?? null,
        archived: input.archive ?? workflow.is_archived,
      },
      createdByUserId: input.actorUserId ?? null,
    },
  );

  await updateLeadCompatibility(supabase, updated.lead_id, updated.id, updated.cee_sheet_id, {
    leadStatus: "lost",
    qualificationStatus: "disqualified",
  });

  return updated;
}

export async function linkTechnicalVisitToWorkflow(
  supabase: Supabase,
  input: {
    workflowId: string;
    technicalVisitId: string;
    actorUserId?: string | null;
    markDone?: boolean;
  },
): Promise<CeeSheetWorkflowRow> {
  const workflow = await getWorkflowOrThrow(supabase, input.workflowId);
  const nextStatus: CeeWorkflowStatus = input.markDone ? "technical_visit_done" : "technical_visit_pending";
  assertWorkflowTransition(workflow.workflow_status as CeeWorkflowStatus, nextStatus);

  const { error: technicalVisitError } = await supabase
    .from("technical_visits")
    .update({ workflow_id: workflow.id })
    .eq("id", input.technicalVisitId);

  if (technicalVisitError) {
    throw new Error(technicalVisitError.message);
  }

  return updateWorkflowAndAppendEvent(
    supabase,
    workflow,
    { workflow_status: nextStatus },
    {
      eventType: input.markDone ? "technical_visit_done" : "technical_visit_linked",
      eventLabel: input.markDone ? "Visite technique effectuée" : "Visite technique liée au workflow",
      payloadJson: {
        technical_visit_id: input.technicalVisitId,
        workflow_status: nextStatus,
      },
      createdByUserId: input.actorUserId ?? null,
    },
  );
}

async function upsertWorkflowDocument(
  supabase: Supabase,
  input: {
    existingDocumentId: string | null;
    subtype: "presentation_commerciale" | "accord_commercial";
    documentType: Database["public"]["Enums"]["document_type"];
    storageBucket: string;
    storagePath: string;
    fileUrl: string;
    issuedAt?: string | null;
  },
): Promise<string> {
  const payload: Database["public"]["Tables"]["documents"]["Insert"] = {
    document_type: input.documentType,
    document_subtype: input.subtype,
    document_status: "valid",
    mime_type: "application/pdf",
    storage_bucket: input.storageBucket,
    storage_path: input.storagePath,
    signature_provider_url: input.fileUrl,
    issued_at: input.issuedAt ?? null,
  };

  if (input.existingDocumentId) {
    const { error } = await supabase
      .from("documents")
      .update(payload)
      .eq("id", input.existingDocumentId);
    if (error) {
      throw new Error(error.message);
    }
    return input.existingDocumentId;
  }

  const { data, error } = await supabase.from("documents").insert(payload).select("id").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de créer le document workflow.");
  }
  return data.id;
}

export async function syncWorkflowCommercialDocumentsFromLeadPdfs(
  supabase: Supabase,
  input: {
    workflowId: string;
    actorUserId?: string | null;
    presentation: {
      storageBucket: string;
      storagePath: string;
      fileUrl: string;
    };
    agreement: {
      storageBucket: string;
      storagePath: string;
      fileUrl: string;
    };
  },
): Promise<CeeSheetWorkflowRow> {
  const workflow = await getWorkflowOrThrow(supabase, input.workflowId);

  const [presentationDocumentId, agreementDocumentId] = await Promise.all([
    upsertWorkflowDocument(supabase, {
      existingDocumentId: workflow.presentation_document_id,
      subtype: "presentation_commerciale",
      documentType: "correspondence",
      storageBucket: input.presentation.storageBucket,
      storagePath: input.presentation.storagePath,
      fileUrl: input.presentation.fileUrl,
      issuedAt: nowIso(),
    }),
    upsertWorkflowDocument(supabase, {
      existingDocumentId: workflow.agreement_document_id,
      subtype: "accord_commercial",
      documentType: "contract",
      storageBucket: input.agreement.storageBucket,
      storagePath: input.agreement.storagePath,
      fileUrl: input.agreement.fileUrl,
      issuedAt: nowIso(),
    }),
  ]);

  return prepareCommercialDocuments(supabase, {
    workflowId: workflow.id,
    actorUserId: input.actorUserId ?? null,
    documents: {
      presentationDocumentId,
      agreementDocumentId,
    },
  });
}
