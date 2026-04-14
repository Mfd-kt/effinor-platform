import { createAdminClient } from "@/lib/supabase/admin";

import { buildManagerTeamSignalsLine } from "./build-agent-message";
import type { AiOpsDetectedIssue } from "./ai-ops-types";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * V1 léger : notifie les managers d’équipe (rôle in_team = manager) si des workflows sans agent existent sur leur équipe.
 * Message agrégé, sans nominatif des agents.
 */
export async function detectUserNeedsHelp(admin: Admin): Promise<AiOpsDetectedIssue[]> {
  const { data: managers, error: mErr } = await admin
    .from("cee_sheet_team_members")
    .select("user_id, cee_sheet_team_id")
    .eq("is_active", true)
    .eq("role_in_team", "manager");
  if (mErr || !managers?.length) return [];

  const { data: wfs, error: wErr } = await admin
    .from("lead_sheet_workflows")
    .select("id, cee_sheet_team_id")
    .is("assigned_agent_user_id", null)
    .not("cee_sheet_team_id", "is", null)
    .neq("workflow_status", "lost")
    .limit(200);
  if (wErr || !wfs?.length) return [];

  const unassignedByTeam = new Map<string, number>();
  for (const w of wfs) {
    const t = w.cee_sheet_team_id!;
    unassignedByTeam.set(t, (unassignedByTeam.get(t) ?? 0) + 1);
  }

  const out: AiOpsDetectedIssue[] = [];

  for (const mgr of managers) {
    const n = unassignedByTeam.get(mgr.cee_sheet_team_id) ?? 0;
    if (n < 2) continue;

    out.push({
      targetUserId: mgr.user_id,
      roleTarget: "manager",
      issueType: "team_unassigned",
      topic: "Vue équipe — dossiers sans agent",
      priority: "normal",
      messageType: "alert",
      body: buildManagerTeamSignalsLine({
        weakSignalCount: n,
        summary: `${n} dossiers sur ton périmètre équipe n’ont pas d’agent assigné. Pense à répartir ou à déclencher une affectation.`,
      }),
      requiresAction: false,
      entityType: "team",
      entityId: mgr.cee_sheet_team_id,
      metadataJson: { detector: "detect-user-needs-help", unassigned_count: n },
    });
  }

  return out;
}
