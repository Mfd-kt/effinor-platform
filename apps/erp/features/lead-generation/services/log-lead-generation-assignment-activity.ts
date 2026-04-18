import { createClient } from "@/lib/supabase/server";

import type {
  LeadGenerationActivityOutcome,
  LeadGenerationActivityType,
} from "../domain/assignment-activity";
import { lgTable } from "../lib/lg-db";

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
};

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
    .select("id, stock_id, agent_id, opened_at, attempt_count")
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
  };

  const isOwner = row.agent_id === input.actorUserId;
  if (!isOwner && !input.allowAsAdmin) {
    throw new Error("Vous n’avez pas le droit d’enregistrer une activité sur cette assignation.");
  }

  const nowIso = new Date().toISOString();
  const activities = lgTable(supabase, "lead_generation_assignment_activities");

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

  const attemptBump = input.activityType === "call" || input.activityType === "email" ? 1 : 0;
  const nextAttempt = row.attempt_count + attemptBump;

  const assignmentPatch: Record<string, unknown> = {
    last_activity_at: nowIso,
    updated_at: nowIso,
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

  return { activity: inserted as LeadGenerationAssignmentActivityRow };
}
