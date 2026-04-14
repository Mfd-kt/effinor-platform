import type { SupabaseClient } from "@supabase/supabase-js";

import { getAutomationConfig } from "@/features/automation/domain/config";
import { insertAutomationLogSupabase } from "@/features/automation/services/automation-log-service";
import type { CeeTeamRole } from "@/features/cee-workflows/domain/constants";
import { getSheetMembersByRole } from "@/features/cee-workflows/services/team-service";
import { assignWorkflowUsers } from "@/features/cee-workflows/services/workflow-service";
import type { CeeSheetWorkflowRow } from "@/features/cee-workflows/types";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

export type UserLoad = { userId: string; load: number };

/**
 * Membres actifs du rôle pour la fiche CEE (équipe).
 */
export async function getAssignableUsersForWorkflow(
  supabase: Supabase,
  ceeSheetId: string,
  role: CeeTeamRole,
): Promise<string[]> {
  const members = await getSheetMembersByRole(supabase, ceeSheetId, role);
  return [...new Set(members.map((m) => m.user_id))];
}

/** Charge = nombre de workflows non archivés encore « en cours » pour ce rôle. */
export async function computeAssignmentLoad(
  supabase: Supabase,
  userId: string,
  role: "confirmateur" | "closer",
): Promise<number> {
  const col =
    role === "confirmateur" ? "assigned_confirmateur_user_id" : "assigned_closer_user_id";
  const statuses =
    role === "confirmateur"
      ? ["to_confirm", "simulation_done"]
      : ["to_close", "agreement_sent", "quote_pending"];

  const { count, error } = await supabase
    .from("lead_sheet_workflows")
    .select("id", { count: "exact", head: true })
    .eq(col, userId)
    .eq("is_archived", false)
    .in("workflow_status", statuses);

  if (error) {
    console.warn("[automation] computeAssignmentLoad:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function computeAssignmentLoadsForUsers(
  supabase: Supabase,
  userIds: string[],
  role: "confirmateur" | "closer",
): Promise<UserLoad[]> {
  const loads = await Promise.all(
    userIds.map(async (userId) => ({
      userId,
      load: await computeAssignmentLoad(supabase, userId, role),
    })),
  );
  return loads.sort((a, b) => a.load - b.load || a.userId.localeCompare(b.userId));
}

export function pickLeastLoadedUser(loads: UserLoad[]): string | null {
  if (loads.length === 0) return null;
  const sorted = [...loads].sort((a, b) => a.load - b.load || a.userId.localeCompare(b.userId));
  return sorted[0].userId;
}

export type AutoAssignResult =
  | { ok: true; workflow: CeeSheetWorkflowRow; assignedUserId: string; reason: string }
  | { ok: false; reason: string };

/**
 * Assignation automatique explicable : parmi les membres d’équipe, choisir le moins chargé.
 */
export async function assignWorkflowAutomatically(
  supabase: Supabase,
  workflow: CeeSheetWorkflowRow,
  role: "confirmateur" | "closer",
  actorUserId: string | null,
): Promise<AutoAssignResult> {
  const cfg = getAutomationConfig();
  if (role === "confirmateur" && !cfg.autoAssignConfirmateur) {
    return { ok: false, reason: "AUTOMATION_AUTO_ASSIGN_CONFIRMATEUR désactivé." };
  }
  if (role === "closer" && !cfg.autoAssignCloser) {
    return { ok: false, reason: "AUTOMATION_AUTO_ASSIGN_CLOSER désactivé." };
  }

  const teamRole: CeeTeamRole = role;
  const candidates = await getAssignableUsersForWorkflow(supabase, workflow.cee_sheet_id, teamRole);
  if (candidates.length === 0) {
    return { ok: false, reason: "Aucun membre actif pour le rôle sur cette fiche." };
  }

  const loads = await computeAssignmentLoadsForUsers(supabase, candidates, role);
  const picked = pickLeastLoadedUser(loads);
  if (!picked) {
    return { ok: false, reason: "Impossible de sélectionner un utilisateur." };
  }

  const updated = await assignWorkflowUsers(supabase, {
    workflowId: workflow.id,
    actorUserId,
    ...(role === "confirmateur"
      ? { assignedConfirmateurUserId: picked }
      : { assignedCloserUserId: picked }),
  });

  await insertAutomationLogSupabase(supabase, {
    automationType: role === "confirmateur" ? "auto_assign_confirmateur" : "auto_assign_closer",
    ruleId: `least_loaded:${role}`,
    workflowId: workflow.id,
    leadId: workflow.lead_id,
    status: "success",
    resultJson: {
      assignedUserId: picked,
      candidates: loads,
    },
  });

  return {
    ok: true,
    workflow: updated,
    assignedUserId: picked,
    reason: `Moins chargé parmi ${candidates.length} candidat(s).`,
  };
}

/**
 * Rééquilibrage global — non implémenté (batch hors requête). Point d’extension documenté.
 */
export async function rebalanceWorkflowAssignments(_supabase: Supabase): Promise<{
  ok: true;
  reassigned: 0;
  message: string;
}> {
  return {
    ok: true,
    reassigned: 0,
    message: "Non implémenté : prévoir un job planifié avec fenêtre métier et garde-fous.",
  };
}

/**
 * Après passage de statut (agent→confirmateur, confirmateur→closer), complète l’affectation si vide.
 */
export async function maybeAutoAssignAfterHandoff(
  supabase: Supabase,
  workflow: CeeSheetWorkflowRow,
  kind: "confirmateur" | "closer",
  actorUserId: string | null,
): Promise<CeeSheetWorkflowRow> {
  try {
    if (kind === "confirmateur") {
      if (workflow.assigned_confirmateur_user_id) return workflow;
      const r = await assignWorkflowAutomatically(supabase, workflow, "confirmateur", actorUserId);
      return r.ok ? r.workflow : workflow;
    }
    if (workflow.assigned_closer_user_id) return workflow;
    const r = await assignWorkflowAutomatically(supabase, workflow, "closer", actorUserId);
    return r.ok ? r.workflow : workflow;
  } catch (e) {
    console.warn("[automation] maybeAutoAssignAfterHandoff:", e instanceof Error ? e.message : e);
    return workflow;
  }
}
