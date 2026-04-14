import { resolveAutomationPublicAppBaseUrl } from "@/features/automation/domain/config";
import { getSlackEnv } from "@/features/notifications/infra/slack-env";
import { sendWebhookMessage } from "@/features/notifications/infra/slack-webhook-client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

import type { AiOpsConversationContext } from "./ai-ops-types";
import { isAiOpsAgentDirectionEscalationEnabled, isAiOpsAgentSlackEnabled } from "./ai-ops-env";
import { buildDirectionEscalationDedupeKey, canSendDirectionEscalation } from "./lib/ai-ops-escalation-dedupe";
import { logAiOpsEvent } from "./services/persist-ai-ops";

const ESCALATION_KEYWORDS =
  /\b(direction|dirigeant|arbitrage|validation direction|escalade|bloqué définitivement|juridique|contrat|avocat)\b/i;
const EXPLICIT_ESCALATION =
  /\b(escalader|transférer à la direction|besoin de la direction|voir avec la direction)\b/i;

export type DirectionEscalationInput = {
  displayName: string | null;
  email: string | null;
  roleLabel: string;
  conversationId: string;
  topic: string;
  urgency: "normal" | "high" | "critical";
  summaryLines: string[];
  expectedAction: string;
  entityUrl?: string | null;
};

export function detectWhenDirectionIsNeeded(
  ctx: AiOpsConversationContext,
  latestUserMessage: string,
): { needed: boolean; reason: string } {
  const text = latestUserMessage.trim();
  if (!text) return { needed: false, reason: "" };

  if (EXPLICIT_ESCALATION.test(text)) {
    return { needed: true, reason: "explicit_escalation" };
  }
  if (ESCALATION_KEYWORDS.test(text) && text.length > 15) {
    return { needed: true, reason: "keyword_structural" };
  }

  const userTurns = ctx.recentMessages.filter((m) => m.senderType === "user").length;
  if (userTurns >= 4 && /bloqu|impossible|pas possible|manque|sans réponse/i.test(text)) {
    return { needed: true, reason: "repeated_blockage" };
  }

  if (ctx.metadataJson && typeof ctx.metadataJson === "object" && !Array.isArray(ctx.metadataJson)) {
    const meta = ctx.metadataJson as Record<string, unknown>;
    if (meta.structural === true || meta.needs_direction === true) {
      return { needed: true, reason: "metadata_flag" };
    }
  }

  return { needed: false, reason: "" };
}

function buildSlackText(input: DirectionEscalationInput): string {
  const base = resolveAutomationPublicAppBaseUrl().replace(/\/$/, "");
  const convUrl = `${base}/agent-operations?conversation=${input.conversationId}`;
  const who = [input.displayName?.trim(), input.email ? `(${input.email})` : null].filter(Boolean).join(" ");
  const lines = [
    "*Demande direction — agent opérations*",
    `Utilisateur : ${who || "—"} · rôle : ${input.roleLabel}`,
    `Sujet : ${input.topic}`,
    `Urgence : ${input.urgency}`,
    ...input.summaryLines.slice(0, 3).map((l) => `· ${l}`),
    `Action attendue : ${input.expectedAction}`,
    input.entityUrl ? `Lien dossier : ${input.entityUrl}` : null,
    `Lien conversation ERP : ${convUrl}`,
  ].filter(Boolean);
  return lines.join("\n");
}

export async function routeAgentEscalationToDirection(
  input: DirectionEscalationInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!isAiOpsAgentDirectionEscalationEnabled()) {
    return { ok: false, error: "escalation_disabled" };
  }
  if (!isAiOpsAgentSlackEnabled()) {
    return { ok: false, error: "slack_disabled" };
  }

  const env = getSlackEnv();
  const url = env.webhooks.direction ?? env.webhooks.alerts ?? env.webhooks.default;
  if (!env.enabled || !url) {
    return { ok: false, error: "slack_not_configured" };
  }

  const admin = createAdminClient();
  const topicFp = `${input.topic}:${input.conversationId}`.slice(0, 80);
  const nowMs = Date.now();
  const gate = await canSendDirectionEscalation(admin, input.conversationId, topicFp, nowMs);
  if (!gate.ok) {
    await logAiOpsEvent(admin, {
      conversationId: input.conversationId,
      eventType: "ai_ops_escalation_skipped",
      channel: "slack_direction",
      status: "skipped",
      payloadJson: { reason: gate.reason, topic: input.topic } as Json,
      dedupeKey: buildDirectionEscalationDedupeKey(input.conversationId, topicFp),
    });
    return { ok: true };
  }

  const dedupeKey = buildDirectionEscalationDedupeKey(input.conversationId, topicFp);
  const text = buildSlackText(input);
  const sent = await sendWebhookMessage(url, { text });
  const payload: Json = {
    conversation_id: input.conversationId,
    topic: input.topic,
    urgency: input.urgency,
  };

  await admin.from("ai_ops_logs").insert({
    conversation_id: input.conversationId,
    target_user_id: null,
    event_type: "ai_ops_escalation_direction",
    channel: "slack_direction",
    payload_json: payload,
    status: sent.ok ? "success" : "failed",
    error_message: sent.ok ? null : sent.error,
    dedupe_key: dedupeKey,
  });

  if (sent.ok) {
    await admin
      .from("ai_conversations")
      .update({ last_escalated_at: new Date(nowMs).toISOString(), updated_at: new Date(nowMs).toISOString() })
      .eq("id", input.conversationId);
  }

  return sent.ok ? { ok: true } : { ok: false, error: sent.error };
}
