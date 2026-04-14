import { resolveAutomationPublicAppBaseUrl } from "@/features/automation/domain/config";
import { getSlackEnv } from "@/features/notifications/infra/slack-env";
import { sendWebhookMessage } from "@/features/notifications/infra/slack-webhook-client";
import type { Json } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import {
  isInternalSlaDirectionAlertsEnabled,
  isInternalSlaManagerAlertsEnabled,
} from "./sla-env";
import type { InternalSlaRuleRow, SlaInstanceStatus } from "./sla-types";

type Admin = SupabaseClient<Database>;

export async function computeSlaEscalationPolicy(
  rule: InternalSlaRuleRow,
  status: SlaInstanceStatus,
): Promise<"none" | "notify" | "manager" | "direction" | "task"> {
  if (status !== "critical" && status !== "breached") return "none";
  if (rule.action_policy === "escalate_direction" && status === "critical") return "direction";
  if (rule.action_policy === "escalate_manager" && (status === "breached" || status === "critical")) return "manager";
  if (rule.action_policy === "create_task" && (status === "breached" || status === "critical")) return "task";
  if (rule.action_policy === "notify") return "notify";
  return "none";
}

async function recentLogHasPayload(
  admin: Admin,
  instanceId: string,
  sinceIso: string,
  predicate: (payload: Record<string, unknown>) => boolean,
): Promise<boolean> {
  const { data } = await admin
    .from("internal_sla_logs")
    .select("payload_json")
    .eq("sla_instance_id", instanceId)
    .gte("created_at", sinceIso)
    .limit(40);
  for (const row of data ?? []) {
    const p = row.payload_json;
    if (p && typeof p === "object" && !Array.isArray(p) && predicate(p as Record<string, unknown>)) return true;
  }
  return false;
}

export async function executeSlaSideEffects(
  admin: Admin,
  input: {
    instanceId: string;
    rule: InternalSlaRuleRow;
    status: SlaInstanceStatus;
    entityType: string;
    entityId: string;
    assignedUserId: string | null;
    managerUserId: string | null;
    metadata: Record<string, unknown>;
    now: Date;
  },
): Promise<{ escalatedCount: number }> {
  let escalatedCount = 0;
  const policy = await computeSlaEscalationPolicy(input.rule, input.status);
  const since = new Date(input.now.getTime() - 24 * 3_600_000).toISOString();
  const base = resolveAutomationPublicAppBaseUrl().replace(/\/$/, "");

  if (policy === "task" && (input.status === "breached" || input.status === "critical")) {
    if (!input.assignedUserId) return { escalatedCount };
    const already = await recentLogHasPayload(
      admin,
      input.instanceId,
      since,
      (p) => p.action === "create_task",
    );
    if (already) return { escalatedCount };

    const title = `SLA — ${input.rule.name}`;
    const desc = `Dépassement sur ${input.entityType} ${input.entityId}. Règle ${input.rule.code}.`;
    await admin.from("tasks").insert({
      title,
      description: desc,
      task_type: "sla_followup",
      priority: input.status === "critical" ? "high" : "normal",
      status: "open",
      due_date: input.now.toISOString(),
      assigned_user_id: input.assignedUserId,
      created_by_user_id: null,
      related_entity_type: input.entityType,
      related_entity_id: input.entityId,
    });
    await admin.from("internal_sla_logs").insert({
      sla_instance_id: input.instanceId,
      rule_code: input.rule.code,
      entity_type: input.entityType,
      entity_id: input.entityId,
      severity: input.status,
      event_type: "action_taken",
      payload_json: { action: "create_task" } as Json,
    });
  }

  if (policy === "direction" && isInternalSlaDirectionAlertsEnabled()) {
    const dup = await recentLogHasPayload(
      admin,
      input.instanceId,
      since,
      (p) => p.channel === "direction" && p.kind === "slack",
    );
    if (dup) return { escalatedCount };

    const env = getSlackEnv();
    const url = env.webhooks.direction ?? env.webhooks.alerts ?? env.webhooks.default;
    if (!env.enabled || !url) return { escalatedCount };

    const lines = [
      "*SLA interne — escalade direction*",
      `Règle : ${input.rule.name} (${input.rule.code})`,
      `Objet : ${input.entityType} ${input.entityId}`,
      `Niveau : ${input.status}`,
      `Responsable (assigné) : ${input.assignedUserId ?? "—"}`,
      `Cockpit : ${base}/cockpit`,
    ];
    const sent = await sendWebhookMessage(url, { text: lines.join("\n") });
    if (sent.ok) {
      escalatedCount = 1;
      await admin.from("internal_sla_logs").insert({
        sla_instance_id: input.instanceId,
        rule_code: input.rule.code,
        entity_type: input.entityType,
        entity_id: input.entityId,
        severity: input.status,
        event_type: "escalated",
        payload_json: { channel: "direction", kind: "slack" } as Json,
      });
    }
  }

  if (policy === "manager" && isInternalSlaManagerAlertsEnabled()) {
    const dup = await recentLogHasPayload(
      admin,
      input.instanceId,
      since,
      (p) => p.action === "slack_manager_alert",
    );
    if (dup) return { escalatedCount };

    const env = getSlackEnv();
    const url = env.webhooks.alerts ?? env.webhooks.admin ?? env.webhooks.default;
    if (!env.enabled || !url) return { escalatedCount };

    const agentHint =
      typeof input.metadata.agent_id === "string" ? `Agent : ${input.metadata.agent_id}` : `Objet : ${input.entityType} ${input.entityId}`;
    const lines = [
      "*SLA interne — manager*",
      `Règle : ${input.rule.name} (${input.rule.code})`,
      agentHint,
      `Niveau : ${input.status}`,
      `Cockpit : ${base}/cockpit`,
    ];
    const sent = await sendWebhookMessage(url, { text: lines.join("\n") });
    if (sent.ok) {
      await admin.from("internal_sla_logs").insert({
        sla_instance_id: input.instanceId,
        rule_code: input.rule.code,
        entity_type: input.entityType,
        entity_id: input.entityId,
        severity: input.status,
        event_type: "action_taken",
        payload_json: { action: "slack_manager_alert" } as Json,
      });
    }
  }

  return { escalatedCount };
}
