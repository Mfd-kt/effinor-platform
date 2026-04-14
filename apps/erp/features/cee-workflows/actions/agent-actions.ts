"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createCommercialCallbackLeadForSimulation } from "@/features/commercial-callbacks/actions/convert-callback-to-lead";
import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import { maybeAutoAssignAfterHandoff } from "@/features/automation/services/workflow-assignment-service";
import {
  appendWorkflowEvent as appendWorkflowEventInService,
  completeSimulation as completeSimulationInService,
  createLeadSheetWorkflow as createLeadSheetWorkflowInService,
  sendToConfirmateur as sendToConfirmateurInService,
} from "@/features/cee-workflows/services/workflow-service";
import { AgentSendToConfirmateurSchema, AgentWorkflowPayloadSchema } from "@/features/cee-workflows/schemas/agent-workspace.schema";
import { findDuplicateLead } from "@/features/leads/lib/find-duplicate-lead";
import { sendStudyEmail } from "@/features/leads/study-pdf/actions/send-study-email";
import { resolveAllowedCeeSheetIdsForAccess } from "@/lib/auth/cee-workflows-scope";
import { getAccessContext } from "@/lib/auth/access-context";
import {
  extractSyncedProspectNotesFromSimulationJson,
  insertAgentProspectQuickNoteIfChanged,
  mergeProspectNotesSyncIntoSimulationJson,
} from "@/features/cee-workflows/lib/sync-agent-quick-note-to-internal-notes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json, Database } from "@/types/database.types";

type AgentActionResult = {
  ok: true;
  workflowId: string;
  leadId: string;
} | {
  ok: false;
  message: string;
  duplicateLeadId?: string;
  duplicateReason?: "company" | "email" | "phone";
};

const FinalizeCommercialCallbackSchema = AgentWorkflowPayloadSchema.extend({
  callbackId: z.string().uuid(),
});

function parseContactName(contactName: string): { firstName: string | null; lastName: string | null } {
  const clean = contactName.trim().replace(/\s+/g, " ");
  if (!clean) return { firstName: null, lastName: null };
  const [first, ...rest] = clean.split(" ");
  return {
    firstName: first ?? null,
    lastName: rest.length ? rest.join(" ") : null,
  };
}

function ensureJsonObject(value: Json | undefined): Json {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }
  return value;
}

async function ensureAgentAccessToSheet(
  access: Extract<Awaited<ReturnType<typeof getAccessContext>>, { kind: "authenticated" }>,
  ceeSheetId: string,
): Promise<void> {
  const supabase = await createClient();
  const allowedSheetIds = await resolveAllowedCeeSheetIdsForAccess(supabase, access);
  if (allowedSheetIds === "all") {
    return;
  }
  if (!allowedSheetIds.includes(ceeSheetId)) {
    throw new Error("Vous n'êtes pas autorisé sur cette fiche CEE.");
  }
}

async function upsertAgentLead(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    leadId?: string;
    userId: string;
    ceeSheetId: string;
    prospect: {
      companyName: string;
      civility?: string;
      contactName: string;
      phone: string;
      email?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      notes?: string;
    };
  },
): Promise<string> {
  const { firstName, lastName } = parseContactName(input.prospect.contactName);
  const address = input.prospect.address?.trim() ?? "";
  const city = input.prospect.city?.trim() ?? "";
  const postalCode = input.prospect.postalCode?.trim() ?? "";

  const leadPatch: Database["public"]["Tables"]["leads"]["Update"] = {
    company_name: input.prospect.companyName.trim(),
    contact_name: input.prospect.contactName.trim(),
    first_name: firstName,
    last_name: lastName,
    phone: input.prospect.phone.trim(),
    email: input.prospect.email?.trim() || null,
    head_office_address: address,
    head_office_city: city,
    head_office_postal_code: postalCode,
    worksite_address: address,
    worksite_city: city,
    worksite_postal_code: postalCode,
    civility: input.prospect.civility?.trim() || null,
    cee_sheet_id: input.ceeSheetId,
    lead_channel: "phone",
    lead_origin: "agent_workstation",
    assigned_to: input.userId,
    owner_user_id: input.userId,
  };

  if (input.leadId) {
    const { error } = await supabase.from("leads").update(leadPatch).eq("id", input.leadId);
    if (error) {
      throw new Error(error.message);
    }
    return input.leadId;
  }

  const duplicate = await findDuplicateLead(supabase, {
    company_name: input.prospect.companyName,
    email: input.prospect.email,
    phone: input.prospect.phone,
  });

  if (duplicate) {
    throw Object.assign(new Error("Un lead existe déjà."), {
      duplicateLeadId: duplicate.id,
      duplicateReason: duplicate.reason,
    });
  }

  const leadInsert: Database["public"]["Tables"]["leads"]["Insert"] = {
    source: "cold_call",
    lead_status: "new",
    qualification_status: "pending",
    created_by_agent_id: input.userId,
    assigned_to: input.userId,
    owner_user_id: input.userId,
    cee_sheet_id: input.ceeSheetId,
    lead_channel: "phone",
    lead_origin: "agent_workstation",
    company_name: input.prospect.companyName.trim(),
    contact_name: input.prospect.contactName.trim(),
    first_name: firstName,
    last_name: lastName,
    phone: input.prospect.phone.trim(),
    email: input.prospect.email?.trim() || null,
    head_office_address: address,
    head_office_city: city,
    head_office_postal_code: postalCode,
    worksite_address: address,
    worksite_city: city,
    worksite_postal_code: postalCode,
    civility: input.prospect.civility?.trim() || null,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(leadInsert)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de créer le lead.");
  }

  return data.id;
}

/**
 * Après envoi au confirmateur : e-mail bienvenue prospect si besoin.
 * Le Slack « dossier transmis » part depuis `sendToConfirmateur` (canal confirmateur).
 */
async function runPostHandoffToConfirmateurNotifications(leadId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: lead, error: leadErr } = await admin.from("leads").select("*").eq("id", leadId).maybeSingle();

  if (leadErr || !lead) {
    console.error("[sendAgentWorkflowToConfirmateur] load lead for notifications:", leadErr?.message);
    return;
  }

  const leadEmail = lead.email?.trim();
  if (!leadEmail || !leadEmail.includes("@") || !lead.company_name?.trim()) {
    return;
  }

  const { data: existingWelcome } = await admin
    .from("lead_emails")
    .select("id")
    .eq("lead_id", leadId)
    .ilike("subject", "%Bienvenue chez Effinor%")
    .limit(1)
    .maybeSingle();

  if (existingWelcome) {
    return;
  }

  const siteName =
    [lead.worksite_address, lead.worksite_postal_code, lead.worksite_city].filter(Boolean).join(", ") || "";

  const result = await sendStudyEmail({
    to: leadEmail,
    leadId,
    clientName: lead.contact_name ?? "",
    companyName: lead.company_name ?? "",
    siteName,
    presentationUrl: null,
    accordUrl: null,
    variant: "A",
    emailType: "premier_contact",
  });

  if (!result.ok) {
    console.error("[sendAgentWorkflowToConfirmateur] premier_contact email failed:", result.error);
  }
}

async function ensureEditableWorkflow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workflowId: string,
) {
  const { data, error } = await supabase
    .from("lead_sheet_workflows")
    .select("*")
    .eq("id", workflowId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Workflow introuvable.");
  }

  if (!["draft", "simulation_done"].includes(data.workflow_status)) {
    throw new Error("Ce workflow n'est plus modifiable côté agent.");
  }

  return data;
}

async function saveDraftInternal(input: unknown): Promise<{ workflowId: string; leadId: string }> {
  const parsed = AgentWorkflowPayloadSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    throw new Error("Non authentifié.");
  }
  await ensureAgentAccessToSheet(access, parsed.data.ceeSheetId);

  const supabase = await createClient();
  const workflowRecord = parsed.data.workflowId
    ? await ensureEditableWorkflow(supabase, parsed.data.workflowId)
    : null;

  const priorLeadId = parsed.data.leadId ?? workflowRecord?.lead_id ?? null;
  const nextProspectNotes = parsed.data.prospect.notes?.trim() ?? "";
  const previousSyncedProspectNotes = workflowRecord
    ? extractSyncedProspectNotesFromSimulationJson(workflowRecord.simulation_input_json)
    : "";

  const leadId = await upsertAgentLead(supabase, {
    leadId: priorLeadId ?? undefined,
    userId: access.userId,
    ceeSheetId: parsed.data.ceeSheetId,
    prospect: parsed.data.prospect,
  });

  await insertAgentProspectQuickNoteIfChanged(
    supabase,
    access,
    leadId,
    previousSyncedProspectNotes,
    nextProspectNotes,
  );

  const workflow =
    workflowRecord ??
    (await createLeadSheetWorkflowInService(supabase, {
      leadId,
      ceeSheetId: parsed.data.ceeSheetId,
      actorUserId: access.userId,
      workflowStatus: "draft",
      assignmentPatch: { assignedAgentUserId: access.userId },
    }));

  const mergedSimulationInput = mergeProspectNotesSyncIntoSimulationJson(
    parsed.data.simulationInputJson as Json | undefined,
    nextProspectNotes,
  );

  const { error } = await supabase
    .from("lead_sheet_workflows")
    .update({
      simulation_input_json: ensureJsonObject(mergedSimulationInput),
      simulation_result_json: ensureJsonObject(parsed.data.simulationResultJson as Json | undefined),
      workflow_status: "draft",
    })
    .eq("id", workflow.id);

  if (error) {
    throw new Error(error.message);
  }

  await appendWorkflowEventInService(supabase, {
    workflowId: workflow.id,
    eventType: "agent_draft_saved",
    eventLabel: "Brouillon agent enregistré",
    payloadJson: {
      cee_sheet_id: parsed.data.ceeSheetId,
    },
    createdByUserId: access.userId,
  });

  revalidatePath("/agent");
  revalidatePath(`/leads/${leadId}`);

  return { workflowId: workflow.id, leadId };
}

export async function saveAgentWorkflowDraft(input: unknown): Promise<AgentActionResult> {
  try {
    const data = await saveDraftInternal(input);
    return { ok: true, ...data };
  } catch (error) {
    const e = error as Error & { duplicateLeadId?: string; duplicateReason?: "company" | "email" | "phone" };
    return {
      ok: false,
      message: e.message,
      duplicateLeadId: e.duplicateLeadId,
      duplicateReason: e.duplicateReason,
    };
  }
}

export async function validateAgentWorkflowSimulation(input: unknown): Promise<AgentActionResult> {
  try {
    const parsed = AgentWorkflowPayloadSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Données invalides.");
    }
    if (!parsed.data.simulationInputJson || !parsed.data.simulationResultJson) {
      throw new Error("La simulation doit être calculée avant validation.");
    }

    const access = await getAccessContext();
    if (access.kind !== "authenticated") {
      throw new Error("Non authentifié.");
    }

    const saved = await saveDraftInternal(parsed.data);
    const supabase = await createClient();
    await completeSimulationInService(supabase, {
      workflowId: saved.workflowId,
      actorUserId: access.userId,
      workflowStatus: "simulation_done",
      simulation: {
        simulationInputJson: parsed.data.simulationInputJson as Json,
        simulationResultJson: parsed.data.simulationResultJson as Json,
      },
    });

    revalidatePath("/agent");
    revalidatePath(`/leads/${saved.leadId}`);

    return { ok: true, ...saved };
  } catch (error) {
    const e = error as Error & { duplicateLeadId?: string; duplicateReason?: "company" | "email" | "phone" };
    return {
      ok: false,
      message: e.message,
      duplicateLeadId: e.duplicateLeadId,
      duplicateReason: e.duplicateReason,
    };
  }
}

/**
 * Conversion rappel → lead : création du lead, validation simulation, puis clôture du rappel.
 * Si la simulation échoue, le lead provisoire est supprimé et le rappel reste actif.
 */
export async function finalizeCommercialCallbackWithSimulation(input: unknown): Promise<AgentActionResult> {
  try {
    const parsed = FinalizeCommercialCallbackSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Données invalides.");
    }
    if (!parsed.data.simulationInputJson || !parsed.data.simulationResultJson) {
      throw new Error("La simulation doit être calculée avant conversion.");
    }

    const access = await getAccessContext();
    if (access.kind !== "authenticated" || !canAccessCommercialCallbacks(access)) {
      throw new Error("Accès refusé.");
    }

    await ensureAgentAccessToSheet(access, parsed.data.ceeSheetId);

    const { callbackId, ...workflowPayload } = parsed.data;

    const supabase = await createClient();
    const { data: cb, error: cbErr } = await supabase
      .from("commercial_callbacks")
      .select("id, status, converted_lead_id")
      .eq("id", callbackId)
      .is("deleted_at", null)
      .maybeSingle();

    if (cbErr || !cb) {
      throw new Error(cbErr?.message ?? "Rappel introuvable.");
    }
    if (cb.status === "converted_to_lead" && cb.converted_lead_id) {
      throw new Error("Ce rappel est déjà converti.");
    }

    const leadStep = await createCommercialCallbackLeadForSimulation({ callbackId });
    if (!leadStep.ok) {
      throw new Error(leadStep.error);
    }
    if (leadStep.callbackWasAlreadyConverted) {
      throw new Error("Ce rappel est déjà converti.");
    }

    const leadId = leadStep.leadId;

    let saved: { workflowId: string; leadId: string };
    try {
      saved = await saveDraftInternal({
        ...workflowPayload,
        leadId,
        workflowId: undefined,
      });
      await completeSimulationInService(supabase, {
        workflowId: saved.workflowId,
        actorUserId: access.userId,
        workflowStatus: "simulation_done",
        simulation: {
          simulationInputJson: parsed.data.simulationInputJson as Json,
          simulationResultJson: parsed.data.simulationResultJson as Json,
        },
      });
    } catch (inner) {
      await supabase.from("leads").delete().eq("id", leadId);
      throw inner;
    }

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
      .eq("id", callbackId);

    if (updErr) {
      throw new Error(`Simulation enregistrée mais rappel non clôturé : ${updErr.message}`);
    }

    revalidatePath("/agent");
    revalidatePath("/leads");
    revalidatePath("/cockpit");
    revalidatePath("/commercial-callbacks");
    revalidatePath(`/leads/${leadId}`);

    return { ok: true, ...saved };
  } catch (error) {
    const e = error as Error & { duplicateLeadId?: string; duplicateReason?: "company" | "email" | "phone" };
    return {
      ok: false,
      message: e.message,
      duplicateLeadId: e.duplicateLeadId,
      duplicateReason: e.duplicateReason,
    };
  }
}

export async function sendAgentWorkflowToConfirmateur(input: unknown): Promise<AgentActionResult> {
  try {
    const parsed = AgentSendToConfirmateurSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Données invalides.");
    }
    if (!parsed.data.simulationInputJson || !parsed.data.simulationResultJson) {
      throw new Error("La simulation doit être calculée avant envoi.");
    }

    const access = await getAccessContext();
    if (access.kind !== "authenticated") {
      throw new Error("Non authentifié.");
    }

    const saved = await saveDraftInternal(parsed.data);
    const supabase = await createClient();

    const workflow = await ensureEditableWorkflow(supabase, saved.workflowId);
    if (workflow.workflow_status === "draft") {
      await completeSimulationInService(supabase, {
        workflowId: saved.workflowId,
        actorUserId: access.userId,
        workflowStatus: "simulation_done",
        simulation: {
          simulationInputJson: parsed.data.simulationInputJson as Json,
          simulationResultJson: parsed.data.simulationResultJson as Json,
        },
      });
    }

    const wfAfter = await sendToConfirmateurInService(supabase, {
      workflowId: saved.workflowId,
      actorUserId: access.userId,
      assignedConfirmateurUserId: parsed.data.assignedConfirmateurUserId,
    });
    await maybeAutoAssignAfterHandoff(supabase, wfAfter, "confirmateur", access.userId);

    await runPostHandoffToConfirmateurNotifications(saved.leadId);

    revalidatePath("/agent");
    revalidatePath(`/leads/${saved.leadId}`);

    return { ok: true, ...saved };
  } catch (error) {
    const e = error as Error & { duplicateLeadId?: string; duplicateReason?: "company" | "email" | "phone" };
    return {
      ok: false,
      message: e.message,
      duplicateLeadId: e.duplicateLeadId,
      duplicateReason: e.duplicateReason,
    };
  }
}
