import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

import type { AiOpsDetectedIssue } from "../ai-ops-types";
import { buildAiOpsDedupeKey, shouldOpenNewConversation } from "../lib/ai-ops-dedupe";
import { canSendAiFollowUp, computeConversationCooldown, isConversationInCooldown } from "../lib/ai-ops-cooldown";
import { computeAiOpsPriority, computeAiOpsSeverity } from "../lib/ai-ops-priority";
import { nextStatusAfterAiMessage } from "../lib/ai-ops-lifecycle";
import { shouldSuppressAiMessageAsDuplicate } from "../lib/ai-ops-messaging-rules";
import {
  aiOpsMaxAiMessagesPerUserPerDayPerIssueType,
  aiOpsMaxOpenConversationsPerUser,
} from "../ai-ops-env";

type Admin = ReturnType<typeof createAdminClient>;

export type AiOpsTickMutableCounters = {
  dedupeSkipped: number;
  cooldownSkipped: number;
  messagesSuppressed: number;
  openCapSkipped: number;
  dailyCapSkipped: number;
  conversationsOpened: number;
  messagesSent: number;
};

export async function logAiOpsEvent(
  admin: Admin,
  input: {
    conversationId?: string | null;
    targetUserId?: string | null;
    eventType: string;
    channel: "in_app" | "slack_dm" | "slack_direction" | "slack_manager" | "system";
    payloadJson?: Json;
    status?: "success" | "failed" | "skipped";
    errorMessage?: string | null;
    dedupeKey?: string | null;
  },
): Promise<void> {
  await admin.from("ai_ops_logs").insert({
    conversation_id: input.conversationId ?? null,
    target_user_id: input.targetUserId ?? null,
    event_type: input.eventType,
    channel: input.channel,
    payload_json: (input.payloadJson ?? {}) as Json,
    status: input.status ?? "success",
    error_message: input.errorMessage ?? null,
    dedupe_key: input.dedupeKey ?? null,
  });
}

type ConversationRow = {
  id: string;
  status: string;
  snoozed_until: string | null;
  updated_at: string;
  resolved_at: string | null;
  dedupe_key: string | null;
  reopen_count: number;
  last_ai_message_at: string | null;
  last_user_message_at: string | null;
  cooldown_until: string | null;
  issue_type: string | null;
};

function startOfUtcDayIso(d: Date): string {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString();
}

async function countOpenConversations(admin: Admin, userId: string): Promise<number> {
  const { count, error } = await admin
    .from("ai_conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["open", "awaiting_user", "escalated", "snoozed"]);
  if (error) return 0;
  return count ?? 0;
}

async function countAiMessagesTodayForUserIssueType(
  admin: Admin,
  userId: string,
  issueType: string,
  now: Date,
): Promise<number> {
  const start = startOfUtcDayIso(now);
  const { data: convs } = await admin.from("ai_conversations").select("id").eq("user_id", userId).eq("issue_type", issueType);
  const ids = (convs ?? []).map((c) => c.id);
  if (!ids.length) return 0;
  const { count, error } = await admin
    .from("ai_messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_type", "ai")
    .gte("created_at", start)
    .in("conversation_id", ids);
  if (error) return 0;
  return count ?? 0;
}

/**
 * Crée, réouvre ou met à jour une conversation et n’envoie un message IA que si la discipline le permet.
 */
export async function ensureConversationWithAgentMessage(
  admin: Admin,
  issue: AiOpsDetectedIssue,
  now: Date,
  counters: AiOpsTickMutableCounters,
): Promise<{ conversationId: string; inserted: boolean; openedNew: boolean } | null> {
  const dedupeKey = buildAiOpsDedupeKey(issue);
  const priority = computeAiOpsPriority(issue);
  const severity = issue.severity ?? computeAiOpsSeverity(issue);
  const nowMs = now.getTime();

  const { data: existing, error: exErr } = await admin
    .from("ai_conversations")
    .select(
      "id, status, snoozed_until, updated_at, resolved_at, dedupe_key, reopen_count, last_ai_message_at, last_user_message_at, cooldown_until, issue_type",
    )
    .eq("user_id", issue.targetUserId)
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();

  if (exErr) return null;

  if (!existing) {
    const openCount = await countOpenConversations(admin, issue.targetUserId);
    if (openCount >= aiOpsMaxOpenConversationsPerUser()) {
      counters.openCapSkipped += 1;
      await logAiOpsEvent(admin, {
        targetUserId: issue.targetUserId,
        eventType: "ai_ops_open_cap_skip",
        channel: "system",
        status: "skipped",
        payloadJson: { dedupe_key: dedupeKey, issue_type: issue.issueType } as Json,
      });
      return null;
    }
  } else {
    if (existing.status === "snoozed" && existing.snoozed_until) {
      const until = new Date(existing.snoozed_until).getTime();
      if (nowMs < until && severity !== "critical") {
        counters.cooldownSkipped += 1;
        await logAiOpsEvent(admin, {
          conversationId: existing.id,
          targetUserId: issue.targetUserId,
          eventType: "ai_ops_snooze_block",
          channel: "system",
          status: "skipped",
          payloadJson: { dedupe_key: dedupeKey } as Json,
        });
        return null;
      }
    }

    if (existing.status === "resolved" || existing.status === "auto_closed") {
      if (!shouldOpenNewConversation(issue, existing as ConversationRow, nowMs)) {
        counters.dedupeSkipped += 1;
        await logAiOpsEvent(admin, {
          conversationId: existing.id,
          targetUserId: issue.targetUserId,
          eventType: "ai_ops_dedupe_skip_resolved_window",
          channel: "system",
          status: "skipped",
          payloadJson: { dedupe_key: dedupeKey } as Json,
        });
        return null;
      }
    }
  }

  let convId: string;
  let openedNew = false;

  if (!existing) {
    const { data: conv, error: cErr } = await admin
      .from("ai_conversations")
      .insert({
        user_id: issue.targetUserId,
        role_target: issue.roleTarget,
        status: nextStatusAfterAiMessage(issue.requiresAction),
        topic: issue.topic,
        priority,
        severity,
        dedupe_key: dedupeKey,
        issue_type: issue.issueType,
        issue_entity_type: issue.entityType ?? null,
        issue_entity_id: issue.entityId ?? null,
        entity_type: issue.entityType ?? null,
        entity_id: issue.entityId ?? null,
        metadata_json: (issue.metadataJson ?? {}) as Json,
        awaiting_user_reply: issue.requiresAction,
        last_ai_message_at: now.toISOString(),
      })
      .select("id")
      .single();
    if (cErr || !conv) return null;
    convId = conv.id;
    openedNew = true;
    counters.conversationsOpened += 1;

    const { error: mErr } = await admin.from("ai_messages").insert({
      conversation_id: convId,
      sender_type: "ai",
      sender_user_id: null,
      message_type: issue.messageType,
      body: issue.body,
      metadata_json: (issue.metadataJson ?? {}) as Json,
      requires_action: issue.requiresAction,
      action_type: issue.actionType ?? null,
      action_payload: issue.actionPayload ?? null,
    });
    if (mErr) return null;

    const coolUntil = new Date(nowMs + computeConversationCooldown(issue.issueType, severity)).toISOString();
    await admin.from("ai_conversations").update({ cooldown_until: coolUntil }).eq("id", convId);

    counters.messagesSent += 1;
    await logAiOpsEvent(admin, {
      conversationId: convId,
      targetUserId: issue.targetUserId,
      eventType: "ai_ops_conversation_opened",
      channel: "in_app",
      payloadJson: { topic: issue.topic, dedupe_key: dedupeKey, issue_type: issue.issueType } as Json,
    });
    return { conversationId: convId, inserted: true, openedNew };
  }

  convId = existing.id;

  if (existing.status === "resolved" || existing.status === "auto_closed") {
    await admin
      .from("ai_conversations")
      .update({
        status: nextStatusAfterAiMessage(issue.requiresAction),
        resolved_at: null,
        auto_closed_at: null,
        reopen_count: (existing.reopen_count ?? 0) + 1,
        priority,
        severity,
        issue_type: issue.issueType,
        issue_entity_type: issue.entityType ?? null,
        issue_entity_id: issue.entityId ?? null,
        entity_type: issue.entityType ?? null,
        entity_id: issue.entityId ?? null,
        metadata_json: (issue.metadataJson ?? {}) as Json,
        topic: issue.topic,
        awaiting_user_reply: issue.requiresAction,
        snoozed_until: null,
        updated_at: now.toISOString(),
      })
      .eq("id", convId);
  }

  const daily = await countAiMessagesTodayForUserIssueType(admin, issue.targetUserId, issue.issueType, now);
  if (daily >= aiOpsMaxAiMessagesPerUserPerDayPerIssueType()) {
    counters.dailyCapSkipped += 1;
    await logAiOpsEvent(admin, {
      conversationId: convId,
      targetUserId: issue.targetUserId,
      eventType: "ai_ops_daily_cap_skip",
      channel: "system",
      status: "skipped",
      payloadJson: { issue_type: issue.issueType } as Json,
    });
    return { conversationId: convId, inserted: false, openedNew: false };
  }

  const convForCooldown: ConversationRow = existing;
  const follow = canSendAiFollowUp(
    {
      cooldown_until: convForCooldown.cooldown_until,
      last_ai_message_at: convForCooldown.last_ai_message_at,
      last_user_message_at: convForCooldown.last_user_message_at,
      severity,
      status: existing.status,
      snoozed_until: existing.snoozed_until,
    },
    { issueType: issue.issueType, priority, severity },
    nowMs,
  );
  if (!follow.ok) {
    counters.cooldownSkipped += 1;
    await logAiOpsEvent(admin, {
      conversationId: convId,
      targetUserId: issue.targetUserId,
      eventType: "ai_ops_cooldown_skip",
      channel: "system",
      status: "skipped",
      payloadJson: { reason: follow.reason } as Json,
    });
    return { conversationId: convId, inserted: false, openedNew: false };
  }

  if (isConversationInCooldown(convForCooldown, nowMs) && severity !== "critical") {
    counters.cooldownSkipped += 1;
    await logAiOpsEvent(admin, {
      conversationId: convId,
      targetUserId: issue.targetUserId,
      eventType: "ai_ops_cooldown_until_skip",
      channel: "system",
      status: "skipped",
      payloadJson: {} as Json,
    });
    return { conversationId: convId, inserted: false, openedNew: false };
  }

  const { data: lastAi } = await admin
    .from("ai_messages")
    .select("body")
    .eq("conversation_id", convId)
    .eq("sender_type", "ai")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const dup = shouldSuppressAiMessageAsDuplicate(lastAi?.body ?? null, issue);
  if (dup.suppress) {
    counters.messagesSuppressed += 1;
    await logAiOpsEvent(admin, {
      conversationId: convId,
      targetUserId: issue.targetUserId,
      eventType: "ai_ops_message_suppressed",
      channel: "system",
      status: "skipped",
      payloadJson: { reason: dup.reason } as Json,
    });
    return { conversationId: convId, inserted: false, openedNew: false };
  }

  const { error: insErr } = await admin.from("ai_messages").insert({
    conversation_id: convId,
    sender_type: "ai",
    sender_user_id: null,
    message_type: issue.messageType,
    body: issue.body,
    metadata_json: (issue.metadataJson ?? {}) as Json,
    requires_action: issue.requiresAction,
    action_type: issue.actionType ?? null,
    action_payload: issue.actionPayload ?? null,
  });
  if (insErr) return null;

  const nextStatus = nextStatusAfterAiMessage(issue.requiresAction);
  const coolUntil = new Date(nowMs + computeConversationCooldown(issue.issueType, severity)).toISOString();

  await admin
    .from("ai_conversations")
    .update({
      awaiting_user_reply: issue.requiresAction,
      priority,
      severity,
      issue_type: issue.issueType,
      issue_entity_type: issue.entityType ?? null,
      issue_entity_id: issue.entityId ?? null,
      entity_type: issue.entityType ?? null,
      entity_id: issue.entityId ?? null,
      metadata_json: (issue.metadataJson ?? {}) as Json,
      topic: issue.topic,
      status: existing.status === "escalated" ? "escalated" : nextStatus,
      cooldown_until: coolUntil,
      last_ai_message_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", convId);

  counters.messagesSent += 1;
  return { conversationId: convId, inserted: true, openedNew };
}

export function getAdmin(): ReturnType<typeof createAdminClient> {
  return createAdminClient();
}
