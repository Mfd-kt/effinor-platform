import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

import type {
  LeadGenerationActivityOutcome,
  LeadGenerationActivityType,
} from "../domain/assignment-activity";
import type { CommercialPipelineStatus } from "../domain/commercial-pipeline-status";
import { nextCommercialPipelineStatusAfterActivity } from "../lib/next-commercial-pipeline-status";
import { LG_CALL_STARTED_ACTIVITY_LABEL, LG_CALL_STUB_MERGE_MS } from "../lib/lg-call-draft";
import { lgTable } from "../lib/lg-db";

import { emitLeadGenerationPipelineEventsAfterActivity } from "../lib/emit-lead-generation-assignment-pipeline-events";
import { refreshLeadGenerationAssignmentSla } from "./refresh-lead-generation-assignment-sla";
import { syncLeadGenerationFollowUpReminderTask } from "./sync-lead-generation-follow-up-reminder-task";

export type LeadGenerationAssignmentActivityRow = {
  id: string;
  assignment_id: string;
  stock_id: string;
  agent_id: string;
  activity_type: string;
  activity_label: string;
  activity_notes: string | null;
  outcome: string | null;
  next_action_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LogLeadGenerationAssignmentActivityInput = {
  assignmentId: string;
  activityType: LeadGenerationActivityType;
  activityLabel: string;
  activityNotes?: string | null;
  outcome?: LeadGenerationActivityOutcome | null;
  nextActionAt?: string | null;
  /** Utilisateur authentifié (contrôle d’accès). */
  actorUserId: string;
  /** True si rôles autorisés à agir pour le compte du commercial (back-office). */
  allowAsAdmin: boolean;
  /**
   * Si une activité « Appel lancé » récente existe sans compte rendu, la mettre à jour au lieu d’insérer.
   */
  mergeLatestCallStub?: boolean;
  /**
   * Ne pas annuler / recréer la tâche de rappel (ex. enregistrement automatique au clic « Appeler »).
   */
  skipFollowUpReminderSync?: boolean;
};

async function findMergeableCallStartedActivityId(
  supabase: SupabaseClient,
  assignmentId: string,
): Promise<string | null> {
  const since = new Date(Date.now() - LG_CALL_STUB_MERGE_MS).toISOString();
  const activities = lgTable(supabase, "lead_generation_assignment_activities");
  const { data, error } = await activities
    .select("id")
    .eq("assignment_id", assignmentId)
    .eq("activity_type", "call")
    .eq("activity_label", LG_CALL_STARTED_ACTIVITY_LABEL)
    .is("activity_notes", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Recherche brouillon d’appel : ${error.message}`);
  }
  const row = data as { id: string } | null;
  return row?.id ?? null;
}

/**
 * Enregistre une activité commerciale et met à jour l’assignation (ouverte / dernière activité / tentatives).
 * L’`agent_id` stocké est toujours celui de l’assignation (commercial porteur).
 */
export async function logLeadGenerationAssignmentActivity(
  input: LogLeadGenerationAssignmentActivityInput,
): Promise<{ activity: LeadGenerationAssignmentActivityRow }> {
  const supabase = await createClient();
  const assignments = lgTable(supabase, "lead_generation_assignments");

  const { data: assignment, error: aErr } = await assignments
    .select("id, stock_id, agent_id, opened_at, attempt_count, commercial_pipeline_status, outcome")
    .eq("id", input.assignmentId)
    .maybeSingle();

  if (aErr) {
    throw new Error(`Assignation : ${aErr.message}`);
  }
  if (!assignment) {
    throw new Error("Assignation introuvable.");
  }

  const row = assignment as {
    id: string;
    stock_id: string;
    agent_id: string;
    opened_at: string | null;
    attempt_count: number;
    commercial_pipeline_status: string | null;
    outcome: string;
  };

  const cur = (row.commercial_pipeline_status ?? "new") as CommercialPipelineStatus;
  const nextPipe = nextCommercialPipelineStatusAfterActivity({
    current: cur,
    nextActionAt: input.nextActionAt,
    activityOutcome: input.outcome ?? null,
  });
  const pipelinePatch: Record<string, unknown> =
    nextPipe === cur ? {} : { commercial_pipeline_status: nextPipe };

  const isOwner = row.agent_id === input.actorUserId;
  if (!isOwner && !input.allowAsAdmin) {
    throw new Error("Vous n’avez pas le droit d’enregistrer une activité sur cette assignation.");
  }

  const nowIso = new Date().toISOString();
  const activities = lgTable(supabase, "lead_generation_assignment_activities");

  const stockTable = lgTable(supabase, "lead_generation_stock");
  const { data: stockRow } = await stockTable.select("company_name").eq("id", row.stock_id).maybeSingle();
  const companyName = ((stockRow as { company_name: string | null } | null)?.company_name ?? "").trim();

  let resultRow: LeadGenerationAssignmentActivityRow;

  const stubId =
    input.mergeLatestCallStub && (input.activityType === "call" || input.activityType === "email")
      ? await findMergeableCallStartedActivityId(supabase, row.id)
      : null;

  if (stubId) {
    const { data: updated, error: upActErr } = await activities
      .update({
        activity_type: input.activityType,
        activity_label: input.activityLabel.trim(),
        activity_notes: input.activityNotes?.trim() || null,
        outcome: input.outcome ?? null,
        next_action_at: input.nextActionAt ?? null,
        updated_at: nowIso,
      })
      .eq("id", stubId)
      .eq("assignment_id", row.id)
      .select("*")
      .single();

    if (upActErr || !updated) {
      throw new Error(`Mise à jour activité : ${upActErr?.message ?? "erreur inconnue"}`);
    }
    resultRow = updated as LeadGenerationAssignmentActivityRow;

    const assignmentPatch: Record<string, unknown> = {
      last_activity_at: nowIso,
      updated_at: nowIso,
      ...pipelinePatch,
    };
    if (!row.opened_at) {
      assignmentPatch.opened_at = nowIso;
    }
    const { error: upErr } = await assignments.update(assignmentPatch).eq("id", row.id);
    if (upErr) {
      throw new Error(`Mise à jour assignation : ${upErr.message}`);
    }
  } else {
    const { data: inserted, error: insErr } = await activities
      .insert({
        assignment_id: row.id,
        stock_id: row.stock_id,
        agent_id: row.agent_id,
        activity_type: input.activityType,
        activity_label: input.activityLabel.trim(),
        activity_notes: input.activityNotes?.trim() || null,
        outcome: input.outcome ?? null,
        next_action_at: input.nextActionAt ?? null,
      })
      .select("*")
      .single();

    if (insErr || !inserted) {
      throw new Error(`Enregistrement activité : ${insErr?.message ?? "erreur inconnue"}`);
    }
    resultRow = inserted as LeadGenerationAssignmentActivityRow;

    const attemptBump = input.activityType === "call" || input.activityType === "email" ? 1 : 0;
    const nextAttempt = row.attempt_count + attemptBump;

    const assignmentPatch: Record<string, unknown> = {
      last_activity_at: nowIso,
      updated_at: nowIso,
      ...pipelinePatch,
    };
    if (!row.opened_at) {
      assignmentPatch.opened_at = nowIso;
    }
    if (attemptBump > 0) {
      assignmentPatch.attempt_count = nextAttempt;
    }

    const { error: upErr } = await assignments.update(assignmentPatch).eq("id", row.id);
    if (upErr) {
      throw new Error(`Mise à jour assignation : ${upErr.message}`);
    }
  }

  await emitLeadGenerationPipelineEventsAfterActivity({
    supabase,
    assignmentId: row.id,
    stockId: row.stock_id,
    agentId: row.agent_id,
    previousPipeline: cur,
    nextPipeline: nextPipe,
    fromOutcome: row.outcome ?? "pending",
    toOutcome: row.outcome ?? "pending",
    occurredAtIso: nowIso,
    activityContext: { activityType: input.activityType, activityLabel: input.activityLabel },
  });

  if (!input.skipFollowUpReminderSync) {
    await syncLeadGenerationFollowUpReminderTask({
      supabase,
      stockId: row.stock_id,
      agentUserId: row.agent_id,
      actorUserId: input.actorUserId,
      companyName,
      followUpAtIso: input.nextActionAt ?? null,
    });
  }

  await refreshLeadGenerationAssignmentSla(supabase, row.id, { notifyOnBreach: true });

  return { activity: resultRow };
}

/**
 * Au clic « Appeler avec Aircall » : crée une ligne d’activité « appel lancé » si aucun brouillon identique n’existe.
 * Ne modifie pas les tâches de rappel.
 */
export async function recordLeadGenerationCallLaunchActivity(input: {
  assignmentId: string;
  actorUserId: string;
  allowAsAdmin: boolean;
}): Promise<{ skipped: boolean }> {
  const supabase = await createClient();
  const assignments = lgTable(supabase, "lead_generation_assignments");
  const { data: assignment, error: aErr } = await assignments
    .select("id, agent_id")
    .eq("id", input.assignmentId)
    .maybeSingle();

  if (aErr) {
    throw new Error(`Assignation : ${aErr.message}`);
  }
  if (!assignment) {
    throw new Error("Assignation introuvable.");
  }

  const row = assignment as { id: string; agent_id: string };
  const isOwner = row.agent_id === input.actorUserId;
  if (!isOwner && !input.allowAsAdmin) {
    throw new Error("Vous n’avez pas le droit d’enregistrer une activité sur cette assignation.");
  }

  const existingStubId = await findMergeableCallStartedActivityId(supabase, row.id);
  if (existingStubId) {
    return { skipped: true };
  }

  await logLeadGenerationAssignmentActivity({
    assignmentId: input.assignmentId,
    activityType: "call",
    activityLabel: LG_CALL_STARTED_ACTIVITY_LABEL,
    activityNotes: null,
    outcome: null,
    nextActionAt: null,
    actorUserId: input.actorUserId,
    allowAsAdmin: input.allowAsAdmin,
    skipFollowUpReminderSync: true,
  });

  return { skipped: false };
}
