"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database.types";

type AiConversationUpdate = Database["public"]["Tables"]["ai_conversations"]["Update"];

import {
  buildAgentAckReply,
  buildAgentEscalationAck,
  buildAgentResolvedAck,
  buildAgentSnoozeAck,
  buildAgentAskClarify,
} from "../build-agent-message";
import { buildAiOpsConversationContext } from "../build-conversation-context";
import { detectWhenDirectionIsNeeded, routeAgentEscalationToDirection } from "../route-agent-escalation";
import { logAiOpsEvent } from "../services/persist-ai-ops";

export type PostAiOpsUserMessageResult =
  | { ok: true }
  | { ok: false; error: string };

function intentFromText(text: string): "escalate" | "resolve" | "snooze" | "ack" | "clarify" {
  const t = text.trim().toLowerCase();
  if (/\b(escalad|direction|arbitrage)\b/i.test(t)) return "escalate";
  if (/\b(résolu|fermer|clos|c'est bon|cest bon|traité)\b/i.test(t)) return "resolve";
  if (/\b(plus tard|snooze|demain|après)\b/i.test(t)) return "snooze";
  if (t.length < 4) return "clarify";
  return "ack";
}

export async function postAiOpsUserMessage(
  conversationId: string,
  body: string,
): Promise<PostAiOpsUserMessageResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié." };
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Message vide." };

  const { data: conv, error: cErr } = await supabase
    .from("ai_conversations")
    .select("id, user_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (cErr || !conv || conv.user_id !== access.userId) {
    return { ok: false, error: "Conversation introuvable." };
  }

  const { error: uErr } = await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    sender_type: "user",
    sender_user_id: access.userId,
    message_type: "reply",
    body: trimmed,
    metadata_json: {},
    requires_action: false,
  });
  if (uErr) return { ok: false, error: uErr.message };

  await logAiOpsEvent(admin, {
    conversationId,
    targetUserId: access.userId,
    eventType: "ai_ops_user_reply",
    channel: "in_app",
    payloadJson: { preview: trimmed.slice(0, 200) } as Json,
  });

  const ctx = await buildAiOpsConversationContext(supabase, conversationId);
  if (!ctx) {
    revalidatePath("/agent-operations");
    return { ok: true };
  }

  const intent = intentFromText(trimmed);
  let aiBody = buildAgentAckReply({});
  let finalStatus: "open" | "awaiting_user" | "snoozed" | "resolved" | "escalated" = "open";
  let awaiting = false;
  let aiMessageType: "reply" | "escalation" = "reply";
  let snoozeUntil: string | null = null;

  if (intent === "resolve") {
    aiBody = buildAgentResolvedAck();
    finalStatus = "resolved";
    awaiting = false;
  } else if (intent === "snooze") {
    aiBody = buildAgentSnoozeAck();
    finalStatus = "snoozed";
    snoozeUntil = new Date(Date.now() + 24 * 3_600_000).toISOString();
    awaiting = false;
  } else if (intent === "clarify") {
    aiBody = buildAgentAskClarify();
    finalStatus = "awaiting_user";
    awaiting = true;
  } else if (intent === "escalate") {
    aiBody = buildAgentEscalationAck();
    finalStatus = "escalated";
    aiMessageType = "escalation";
    awaiting = true;
  } else {
    const dir = detectWhenDirectionIsNeeded(ctx, trimmed);
    if (dir.needed) {
      aiBody = buildAgentEscalationAck();
      finalStatus = "escalated";
      aiMessageType = "escalation";
      awaiting = true;
    } else {
      finalStatus = "open";
      awaiting = false;
    }
  }

  const { error: aiErr } = await admin.from("ai_messages").insert({
    conversation_id: conversationId,
    sender_type: "ai",
    sender_user_id: null,
    message_type: aiMessageType,
    body: aiBody,
    metadata_json: { intent } as Json,
    requires_action: false,
  });
  if (aiErr) return { ok: false, error: aiErr.message };

  const nowIso = new Date().toISOString();
  const updatePayload: AiConversationUpdate = {
    status: finalStatus,
    awaiting_user_reply: awaiting,
    updated_at: nowIso,
  };
  if (finalStatus === "resolved") {
    updatePayload.resolved_at = nowIso;
    updatePayload.cooldown_until = null;
    updatePayload.snoozed_until = null;
  }
  if (finalStatus === "snoozed" && snoozeUntil) {
    updatePayload.snoozed_until = snoozeUntil;
  }
  if (finalStatus === "open") {
    updatePayload.snoozed_until = null;
  }

  await supabase.from("ai_conversations").update(updatePayload).eq("id", conversationId);

  const shouldNotifyDirection = finalStatus === "escalated";
  if (shouldNotifyDirection) {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", access.userId)
      .maybeSingle();
    const { data: ur } = await admin.from("user_roles").select("role_id").eq("user_id", access.userId).limit(12);
    const roleIds = [...new Set((ur ?? []).map((r) => r.role_id))];
    let roleLabel: string = ctx.roleTarget;
    if (roleIds.length) {
      const { data: rnames } = await admin.from("roles").select("code").in("id", roleIds);
      const codes = (rnames ?? []).map((r) => r.code).filter(Boolean).join(", ");
      if (codes) roleLabel = codes;
    }

    const base =
      process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
      process.env.APP_URL?.trim().replace(/\/$/, "") ||
      "";
    const entityUrl =
      ctx.entityType === "lead" && ctx.entityId && base ? `${base}/leads/${ctx.entityId}` : null;
    const dirReason = detectWhenDirectionIsNeeded(ctx, trimmed).reason || intent;

    await routeAgentEscalationToDirection({
      displayName: profile?.full_name ?? null,
      email: profile?.email ?? access.email,
      roleLabel,
      conversationId,
      topic: ctx.topic,
      urgency:
        ctx.severity === "critical" || ctx.priority === "critical"
          ? "critical"
          : ctx.severity === "high" || ctx.priority === "high"
            ? "high"
            : "normal",
      summaryLines: [trimmed.slice(0, 280), `Motif : ${dirReason}`],
      expectedAction: "Arbitrage ou correction configuration / accès.",
      entityUrl,
    });
  }

  revalidatePath("/agent-operations");
  return { ok: true };
}

export async function postAiOpsQuickReply(
  conversationId: string,
  kind: "take_care" | "show_me" | "escalate" | "resolved",
): Promise<PostAiOpsUserMessageResult> {
  const map = {
    take_care: "Je m’en occupe.",
    show_me: "Peux-tu me montrer lequel ?",
    escalate: "J’ai besoin que la direction intervienne.",
    resolved: "C’est traité, tu peux clôturer.",
  } as const;
  return postAiOpsUserMessage(conversationId, map[kind]);
}
