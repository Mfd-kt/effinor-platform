import { createAdminClient } from "@/lib/supabase/admin";

import { buildLeadNewUntreatedLine, buildLeadSimulatorFollowupLine } from "./build-agent-message";
import type { AiOpsDetectedIssue } from "./ai-ops-types";
import { resolveRoleTargetForUser } from "./services/resolve-role-target";

type Admin = ReturnType<typeof createAdminClient>;

export async function detectBadlyHandledLeads(admin: Admin, now: Date): Promise<AiOpsDetectedIssue[]> {
  const since = new Date(now.getTime() - 72 * 3_600_000).toISOString();
  const { data: rows, error } = await admin
    .from("leads")
    .select(
      "id, company_name, created_at, simulated_at, created_by_agent_id, phone, lead_status",
    )
    .is("deleted_at", null)
    .eq("lead_status", "new")
    .gte("created_at", since)
    .limit(400);
  if (error || !rows?.length) return [];

  const out: AiOpsDetectedIssue[] = [];
  const ms24h = 24 * 3_600_000;

  for (const L of rows) {
    const uid = L.created_by_agent_id;
    if (!uid) continue;

    const created = new Date(L.created_at).getTime();
    const ageMs = now.getTime() - created;
    const simAt = L.simulated_at ? new Date(L.simulated_at).getTime() : null;
    const hoursSinceSim = simAt != null ? (now.getTime() - simAt) / 3_600_000 : null;

    let body: string | null = null;
    let topic = "Lead à traiter";
    let priority: AiOpsDetectedIssue["priority"] = "normal";
    let dedupeSuffix = "";

    if (simAt != null && hoursSinceSim != null && hoursSinceSim >= 12) {
      body = buildLeadSimulatorFollowupLine({
        companyName: L.company_name?.trim() || "Sans nom",
        hoursSince: hoursSinceSim,
      });
      topic = "Simulateur sans suite";
      priority = "high";
      dedupeSuffix = "sim";
    } else if (ageMs >= ms24h) {
      body = buildLeadNewUntreatedLine({ companyName: L.company_name?.trim() || "Sans nom" });
      topic = "Nouveau lead en attente";
      priority = "normal";
      dedupeSuffix = "new";
    }

    if (!body) continue;

    const roleTarget = await resolveRoleTargetForUser(admin, uid);
    out.push({
      targetUserId: uid,
      roleTarget,
      issueType: "badly_handled_lead",
      topic,
      priority,
      messageType: "recommendation",
      body,
      requiresAction: true,
      actionType: "open_lead",
      actionPayload: { lead_id: L.id, href: `/leads/${L.id}` },
      entityType: "lead",
      entityId: L.id,
      metadataJson: { detector: "detect-badly-handled-leads", variant: dedupeSuffix },
    });
  }

  return out;
}
