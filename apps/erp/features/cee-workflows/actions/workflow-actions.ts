"use server";

import { revalidatePath } from "next/cache";

import { maybeAutoAssignAfterHandoff } from "@/features/automation/services/workflow-assignment-service";
import {
  appendWorkflowEvent as appendWorkflowEventInService,
  assignWorkflowUsers as assignWorkflowUsersInService,
  completeSimulation as completeSimulationInService,
  createLeadSheetWorkflow as createLeadSheetWorkflowInService,
  switchLeadToCeeSheetWorkflow as switchLeadToCeeSheetWorkflowInService,
  markAgreementSent as markAgreementSentInService,
  markAgreementSigned as markAgreementSignedInService,
  markWorkflowLost as markWorkflowLostInService,
  prepareCommercialDocuments as prepareCommercialDocumentsInService,
  qualifyWorkflow as qualifyWorkflowInService,
  sendToCloser as sendToCloserInService,
  sendToConfirmateur as sendToConfirmateurInService,
} from "@/features/cee-workflows/services/workflow-service";
import {
  AssignWorkflowUsersSchema,
  CompleteSimulationSchema,
  CreateLeadSheetWorkflowSchema,
  SwitchLeadCeeSheetWorkflowSchema,
  MarkAgreementSentSchema,
  MarkAgreementSignedSchema,
  MarkWorkflowLostSchema,
  PrepareCommercialDocumentsSchema,
  SendToRoleSchema,
  WorkflowEventSchema,
  WorkflowQualificationSchema,
} from "@/features/cee-workflows/schemas/cee-workflow.schema";
import type { CeeSheetWorkflowEventRow, CeeSheetWorkflowRow } from "@/features/cee-workflows/types";
import { getAccessContext } from "@/lib/auth/access-context";
import { canReassignWorkflowRoles } from "@/lib/auth/lead-permissions";
import { canUserSwitchLeadCeeSheetOnLead } from "@/lib/auth/switch-cee-sheet-eligibility";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

type WorkflowActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function getAuthenticatedSupabase(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; message: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { ok: false, message: "Session expirée." };
  }

  return { ok: true, supabase, userId: user.id };
}

function revalidateWorkflowPaths(workflow: Pick<CeeSheetWorkflowRow, "lead_id" | "id">) {
  revalidatePath("/leads");
  revalidatePath(`/leads/${workflow.lead_id}`);
}

export async function createLeadSheetWorkflow(
  input: unknown,
): Promise<WorkflowActionResult<CeeSheetWorkflowRow>> {
  const parsed = CreateLeadSheetWorkflowSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const auth = await getAuthenticatedSupabase();
  if (!auth.ok) return auth;

  try {
    const workflow = await createLeadSheetWorkflowInService(auth.supabase, {
      leadId: parsed.data.leadId,
      ceeSheetId: parsed.data.ceeSheetId,
      workflowStatus: parsed.data.workflowStatus,
      assignmentPatch: parsed.data.assignmentPatch,
      actorUserId: auth.userId,
    });
    revalidateWorkflowPaths(workflow);
    return { ok: true, data: workflow };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function switchLeadToCeeSheetWorkflow(
  input: unknown,
): Promise<WorkflowActionResult<CeeSheetWorkflowRow>> {
  const parsed = SwitchLeadCeeSheetWorkflowSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const access = await getAccessContext();
  const auth = await getAuthenticatedSupabase();
  if (!auth.ok) return auth;

  const { data: leadRow, error: leadErr } = await auth.supabase
    .from("leads")
    .select("id, created_by_agent_id, confirmed_by_user_id")
    .eq("id", parsed.data.leadId)
    .is("deleted_at", null)
    .maybeSingle();
  if (leadErr || !leadRow) {
    return { ok: false, message: leadErr?.message ?? "Lead introuvable." };
  }
  if (!(await canUserSwitchLeadCeeSheetOnLead(auth.supabase, access, leadRow))) {
    return {
      ok: false,
      message:
        "Accès refusé : seuls le super administrateur, le confirmateur, le closer ou un manager d’équipe CEE (sur la fiche du dossier) peuvent changer la fiche CEE.",
    };
  }

  try {
    let workflowCleanupClient = auth.supabase;
    try {
      workflowCleanupClient = createAdminClient();
    } catch {
      // Sans service_role, le nettoyage des anciens workflows repose sur les droits RLS (ex. super_admin).
    }
    const workflow = await switchLeadToCeeSheetWorkflowInService(
      auth.supabase,
      {
        leadId: parsed.data.leadId,
        newCeeSheetId: parsed.data.newCeeSheetId,
        actorUserId: auth.userId,
        copyRoleAssignments: parsed.data.copyRoleAssignments,
        syncProductInterest: parsed.data.syncProductInterest,
      },
      { workflowCleanupClient },
    );
    revalidateWorkflowPaths(workflow);
    revalidatePath("/confirmateur");
    revalidatePath("/closer");
    revalidatePath("/agent");
    return { ok: true, data: workflow };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function assignWorkflowUsers(
  input: unknown,
): Promise<WorkflowActionResult<CeeSheetWorkflowRow>> {
  const parsed = AssignWorkflowUsersSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canReassignWorkflowRoles(access.roleCodes)) {
    return { ok: false, message: "Seul le super administrateur peut modifier les affectations du workflow." };
  }
  const auth = await getAuthenticatedSupabase();
  if (!auth.ok) return auth;
  try {
    const workflow = await assignWorkflowUsersInService(auth.supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: auth.userId,
      ceeSheetTeamId: parsed.data.ceeSheetTeamId,
      assignedAgentUserId: parsed.data.assignedAgentUserId,
      assignedConfirmateurUserId: parsed.data.assignedConfirmateurUserId,
      assignedCloserUserId: parsed.data.assignedCloserUserId,
    });
    revalidateWorkflowPaths(workflow);
    return { ok: true, data: workflow };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function completeSimulation(
  input: unknown,
): Promise<WorkflowActionResult<CeeSheetWorkflowRow>> {
  const parsed = CompleteSimulationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const auth = await getAuthenticatedSupabase();
  if (!auth.ok) return auth;
  try {
    const workflow = await completeSimulationInService(auth.supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: auth.userId,
      workflowStatus: parsed.data.workflowStatus,
      simulation: {
        simulationInputJson: parsed.data.simulationInputJson as Json,
        simulationResultJson: parsed.data.simulationResultJson as Json,
      },
    });
    revalidateWorkflowPaths(workflow);
    return { ok: true, data: workflow };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function sendToConfirmateur(
  input: unknown,
): Promise<WorkflowActionResult<CeeSheetWorkflowRow>> {
  const parsed = SendToRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const auth = await getAuthenticatedSupabase();
  if (!auth.ok) return auth;
  try {
    let workflow = await sendToConfirmateurInService(auth.supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: auth.userId,
      assignedConfirmateurUserId: parsed.data.assignedUserId,
    });
    workflow = await maybeAutoAssignAfterHandoff(auth.supabase, workflow, "confirmateur", auth.userId);
    revalidateWorkflowPaths(workflow);
    return { ok: true, data: workflow };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function qualifyWorkflow(
  input: unknown,
): Promise<WorkflowActionResult<CeeSheetWorkflowRow>> {
  const parsed = WorkflowQualificationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const auth = await getAuthenticatedSupabase();
  if (!auth.ok) return auth;
  try {
    const workflow = await qualifyWorkflowInService(auth.supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: auth.userId,
      qualificationDataJson: parsed.data.qualificationDataJson as Json,
    });
    revalidateWorkflowPaths(workflow);
    return { ok: true, data: workflow };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function prepareCommercialDocuments(
  input: unknown,
): Promise<WorkflowActionResult<CeeSheetWorkflowRow>> {
  const parsed = PrepareCommercialDocumentsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const auth = await getAuthenticatedSupabase();
  if (!auth.ok) return auth;
  try {
    const workflow = await prepareCommercialDocumentsInService(auth.supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: auth.userId,
      documents: {
        presentationDocumentId: parsed.data.presentationDocumentId,
        agreementDocumentId: parsed.data.agreementDocumentId,
        quoteDocumentId: parsed.data.quoteDocumentId,
      },
    });
    revalidateWorkflowPaths(workflow);
    return { ok: true, data: workflow };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function sendToCloser(
  input: unknown,
): Promise<WorkflowActionResult<CeeSheetWorkflowRow>> {
  const parsed = SendToRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const auth = await getAuthenticatedSupabase();
  if (!auth.ok) return auth;
  try {
    let workflow = await sendToCloserInService(auth.supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: auth.userId,
      assignedCloserUserId: parsed.data.assignedUserId,
    });
    workflow = await maybeAutoAssignAfterHandoff(auth.supabase, workflow, "closer", auth.userId);
    revalidateWorkflowPaths(workflow);
    return { ok: true, data: workflow };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function markAgreementSent(
  input: unknown,
): Promise<WorkflowActionResult<CeeSheetWorkflowRow>> {
  const parsed = MarkAgreementSentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const auth = await getAuthenticatedSupabase();
  if (!auth.ok) return auth;
  try {
    const workflow = await markAgreementSentInService(auth.supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: auth.userId,
      agreementDocumentId: parsed.data.agreementDocumentId,
      signatureProvider: parsed.data.signatureProvider,
      signatureRequestId: parsed.data.signatureRequestId,
      signatureStatus: parsed.data.signatureStatus,
    });
    revalidateWorkflowPaths(workflow);
    return { ok: true, data: workflow };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function markAgreementSigned(
  input: unknown,
): Promise<WorkflowActionResult<CeeSheetWorkflowRow>> {
  const parsed = MarkAgreementSignedSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const auth = await getAuthenticatedSupabase();
  if (!auth.ok) return auth;
  try {
    const workflow = await markAgreementSignedInService(auth.supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: auth.userId,
      signatureProvider: parsed.data.signatureProvider,
      signatureRequestId: parsed.data.signatureRequestId,
      signatureStatus: parsed.data.signatureStatus,
    });
    revalidateWorkflowPaths(workflow);
    return { ok: true, data: workflow };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function markWorkflowLost(
  input: unknown,
): Promise<WorkflowActionResult<CeeSheetWorkflowRow>> {
  const parsed = MarkWorkflowLostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const auth = await getAuthenticatedSupabase();
  if (!auth.ok) return auth;
  try {
    const workflow = await markWorkflowLostInService(auth.supabase, {
      workflowId: parsed.data.workflowId,
      actorUserId: auth.userId,
      reason: parsed.data.reason,
      archive: parsed.data.archive,
    });
    revalidateWorkflowPaths(workflow);
    return { ok: true, data: workflow };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function appendWorkflowEvent(
  input: unknown,
): Promise<WorkflowActionResult<CeeSheetWorkflowEventRow>> {
  const parsed = WorkflowEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const auth = await getAuthenticatedSupabase();
  if (!auth.ok) return auth;
  try {
    const event = await appendWorkflowEventInService(auth.supabase, {
      workflowId: parsed.data.workflowId,
      eventType: parsed.data.eventType,
      eventLabel: parsed.data.eventLabel,
      payloadJson: parsed.data.payloadJson as Json | undefined,
      createdByUserId: auth.userId,
    });
    return { ok: true, data: event };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}
