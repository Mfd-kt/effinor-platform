import { createAdminClient } from "@/lib/supabase/admin";

import { buildMissingFieldsLine } from "./build-agent-message";
import type { AiOpsDetectedIssue } from "./ai-ops-types";
import { resolveRoleTargetForUser } from "./services/resolve-role-target";

type Admin = ReturnType<typeof createAdminClient>;

/** V1 : champs de base manquants sur leads actifs (non supprimés). */
export async function detectMissingFields(admin: Admin): Promise<AiOpsDetectedIssue[]> {
  const { data: rows, error } = await admin
    .from("leads")
    .select("id, company_name, phone, email, created_by_agent_id, lead_status, head_office_city")
    .is("deleted_at", null)
    .neq("lead_status", "lost")
    .limit(500);
  if (error || !rows?.length) return [];

  const out: AiOpsDetectedIssue[] = [];

  for (const L of rows) {
    const uid = L.created_by_agent_id;
    if (!uid) continue;

    const missing: string[] = [];
    if (!L.company_name?.trim()) missing.push("raison sociale");
    if (!L.phone?.trim()) missing.push("téléphone");
    if (!L.head_office_city?.trim()) missing.push("ville siège");
    if (missing.length < 2) continue;

    const roleTarget = await resolveRoleTargetForUser(admin, uid);
    out.push({
      targetUserId: uid,
      roleTarget,
      issueType: "missing_fields",
      topic: "Informations lead incomplètes",
      priority: "normal",
      messageType: "question",
      body: buildMissingFieldsLine({
        entityLabel: `le lead « ${L.company_name?.trim() || "Sans nom"} »`,
        fields: missing,
      }),
      requiresAction: true,
      actionType: "open_lead",
      actionPayload: { lead_id: L.id, href: `/leads/${L.id}` },
      entityType: "lead",
      entityId: L.id,
      metadataJson: { detector: "detect-missing-fields", missing },
    });
  }

  return out;
}
