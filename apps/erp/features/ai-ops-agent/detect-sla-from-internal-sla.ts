import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { isInternalSlaEnabled } from "@/features/internal-sla/sla-env";

import type { AiOpsDetectedIssue, AiOpsRoleTarget } from "./ai-ops-types";

type Admin = SupabaseClient<Database>;

export function buildSlaBreachHumanMessage(input: {
  ruleName: string;
  status: string;
  minutesLate: number;
  entityType: string;
  entityLabel?: string | null;
}): string {
  const late =
    input.minutesLate >= 120
      ? `${Math.round(input.minutesLate / 60)} h de retard`
      : `${input.minutesLate} min de retard`;
  const obj =
    input.entityType === "callback"
      ? "Ce rappel commercial"
      : input.entityType === "lead"
        ? "Ce lead"
        : input.entityType === "workflow"
          ? "Ce dossier"
          : input.entityType === "user"
            ? "Ce périmètre commercial"
            : "Cet élément";
  const label = input.entityLabel?.trim() ? ` (${input.entityLabel.trim()})` : "";
  const sev =
    input.status === "critical"
      ? "niveau critique"
      : input.status === "breached"
        ? "dépasse le délai interne"
        : "approche ou dépasse le premier seuil";
  return `${obj}${label} ${sev} sur la règle « ${input.ruleName} » — ${late} après l’échéance cible. Ouvre l’ERP et traite la priorité.`;
}

export async function detectSlaBreachesForAiOps(admin: Admin, now: Date): Promise<AiOpsDetectedIssue[]> {
  if (!isInternalSlaEnabled()) return [];

  const [{ data: rules }, { data: rows }] = await Promise.all([
    admin.from("internal_sla_rules").select("code, name, action_policy, role_target").eq("is_active", true),
    admin
      .from("internal_sla_instances")
      .select("id, rule_code, entity_type, entity_id, assigned_user_id, status, target_due_at, metadata_json")
      .in("status", ["warning", "breached", "critical"])
      .limit(280),
  ]);

  const ruleMap = new Map((rules ?? []).map((r) => [r.code, r]));
  const out: AiOpsDetectedIssue[] = [];
  const nowMs = now.getTime();

  for (const row of rows ?? []) {
    if (!row.assigned_user_id) continue;
    const rule = ruleMap.get(row.rule_code);
    if (!rule) continue;

    const targetMs = new Date(row.target_due_at).getTime();
    const minutesLate = Math.max(0, Math.floor((nowMs - targetMs) / 60_000));
    const meta =
      row.metadata_json && typeof row.metadata_json === "object" && !Array.isArray(row.metadata_json)
        ? (row.metadata_json as Record<string, unknown>)
        : {};
    const company = typeof meta.company === "string" ? meta.company : null;

    const body = buildSlaBreachHumanMessage({
      ruleName: rule.name,
      status: row.status,
      minutesLate,
      entityType: row.entity_type,
      entityLabel: company,
    });

    const priority =
      row.status === "critical" ? "critical" : row.status === "breached" ? "high" : "normal";
    const severity =
      row.status === "critical" ? "critical" : row.status === "breached" ? "high" : "warning";

    out.push({
      targetUserId: row.assigned_user_id,
      roleTarget: rule.role_target as AiOpsRoleTarget,
      issueType: "sla_breach",
      topic: `SLA — ${rule.name}`,
      priority,
      severity,
      messageType: "alert",
      body,
      requiresAction: true,
      entityType: row.entity_type,
      entityId: row.entity_id,
      metadataJson: {
        sla_instance_id: row.id,
        rule_code: row.rule_code,
        rule_name: rule.name,
        target_due_at: row.target_due_at,
        minutes_late: minutesLate,
        action_policy: rule.action_policy,
        status: row.status,
      },
    });
  }

  return out;
}
