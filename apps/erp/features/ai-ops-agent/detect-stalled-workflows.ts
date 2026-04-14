import { createAdminClient } from "@/lib/supabase/admin";

import { buildWorkflowMissingAgentLine } from "./build-agent-message";
import type { AiOpsDetectedIssue } from "./ai-ops-types";
import { resolveRoleTargetForUser } from "./services/resolve-role-target";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Workflows sans agent alors qu’une équipe existe : premier agent actif de l’équipe est notifié (aligné cockpit).
 */
export async function detectStalledWorkflows(admin: Admin): Promise<AiOpsDetectedIssue[]> {
  const { data: wfRows, error: wfErr } = await admin
    .from("lead_sheet_workflows")
    .select("id, cee_sheet_team_id, lead_id, workflow_status")
    .is("assigned_agent_user_id", null)
    .not("cee_sheet_team_id", "is", null)
    .neq("workflow_status", "lost")
    .limit(60);
  if (wfErr || !wfRows?.length) return [];

  const teamIds = [...new Set(wfRows.map((w) => w.cee_sheet_team_id).filter(Boolean))] as string[];
  const { data: members, error: memErr } = await admin
    .from("cee_sheet_team_members")
    .select("cee_sheet_team_id, user_id, role_in_team, is_active")
    .in("cee_sheet_team_id", teamIds)
    .eq("is_active", true)
    .eq("role_in_team", "agent");
  if (memErr || !members?.length) return [];

  const byTeam = new Map<string, string[]>();
  for (const m of members) {
    if (!byTeam.has(m.cee_sheet_team_id)) byTeam.set(m.cee_sheet_team_id, []);
    byTeam.get(m.cee_sheet_team_id)!.push(m.user_id);
  }

  const out: AiOpsDetectedIssue[] = [];

  for (const w of wfRows) {
    const tid = w.cee_sheet_team_id;
    if (!tid) continue;
    const agents = byTeam.get(tid);
    const pick = agents?.[0];
    if (!pick) continue;

    const roleTarget = await resolveRoleTargetForUser(admin, pick);
    out.push({
      targetUserId: pick,
      roleTarget,
      issueType: "stalled_workflow",
      topic: "Dossier sans agent",
      priority: "high",
      messageType: "alert",
      body: buildWorkflowMissingAgentLine({
        hint: "Tu peux t’assigner ou demander à ton manager si le périmètre n’est pas clair.",
      }),
      requiresAction: true,
      actionType: "open_lead",
      actionPayload: { workflow_id: w.id, lead_id: w.lead_id, href: w.lead_id ? `/leads/${w.lead_id}` : "/leads" },
      entityType: "workflow",
      entityId: w.id,
      metadataJson: { detector: "detect-stalled-workflows", lead_id: w.lead_id },
    });
  }

  return out;
}
