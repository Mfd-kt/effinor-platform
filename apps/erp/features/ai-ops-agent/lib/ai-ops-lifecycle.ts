import type { Json } from "@/types/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

import type { AiOpsConversationStatus } from "../ai-ops-types";
import { AI_OPS_REOPEN_AFTER_RESOLVED_MS } from "./ai-ops-dedupe";

type Admin = ReturnType<typeof createAdminClient>;

const STALE_AUTO_CLOSE_MS = 14 * 24 * 3_600_000;

export async function unsnoozeExpiredConversations(admin: Admin, now: Date): Promise<number> {
  const { data, error } = await admin
    .from("ai_conversations")
    .update({
      status: "open",
      snoozed_until: null,
      updated_at: now.toISOString(),
    })
    .eq("status", "snoozed")
    .lte("snoozed_until", now.toISOString())
    .select("id");
  if (error) return 0;
  return data?.length ?? 0;
}

export async function autoCloseInactiveConversations(admin: Admin, now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - STALE_AUTO_CLOSE_MS).toISOString();
  const { data, error } = await admin
    .from("ai_conversations")
    .update({
      status: "auto_closed",
      auto_closed_at: now.toISOString(),
      awaiting_user_reply: false,
      updated_at: now.toISOString(),
    })
    .in("status", ["open", "awaiting_user"])
    .lt("updated_at", cutoff)
    .select("id");
  if (error) return 0;
  return data?.length ?? 0;
}

export async function resolveAiConversation(
  admin: Admin,
  conversationId: string,
  userId: string,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const { error } = await admin
    .from("ai_conversations")
    .update({
      status: "resolved",
      resolved_at: now,
      awaiting_user_reply: false,
      snoozed_until: null,
      cooldown_until: null,
      updated_at: now,
      metadata_json: { resolution_reason: reason } as unknown as Json,
    })
    .eq("id", conversationId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function snoozeAiConversation(
  admin: Admin,
  conversationId: string,
  userId: string,
  until: Date,
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const { error } = await admin
    .from("ai_conversations")
    .update({
      status: "snoozed",
      snoozed_until: until.toISOString(),
      awaiting_user_reply: false,
      updated_at: now,
    })
    .eq("id", conversationId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function nextStatusAfterUserReply(
  current: AiOpsConversationStatus,
  intent: "escalate" | "resolve" | "snooze" | "ack" | "clarify",
): AiOpsConversationStatus | null {
  if (intent === "resolve") return "resolved";
  if (intent === "snooze") return "snoozed";
  if (intent === "escalate") return "escalated";
  if (intent === "clarify") return current === "awaiting_user" ? "open" : current;
  return "open";
}

export function nextStatusAfterAiMessage(requiresAction: boolean): AiOpsConversationStatus {
  return requiresAction ? "awaiting_user" : "open";
}

/** Problème résolu côté données : on peut clôturer sans nouveau message IA. */
export function autoResolveIfIssueGone(issueStillActive: boolean): boolean {
  return !issueStillActive;
}

/** Après résolution / auto_close, réouvrir seulement si le problème est de retour et la fenêtre écoulée. */
export function reopenIfIssueReturns(
  conversation: { status: string; resolved_at: string | null; updated_at: string },
  issueStillPresent: boolean,
  nowMs: number,
): boolean {
  if (!issueStillPresent) return false;
  if (conversation.status !== "resolved" && conversation.status !== "auto_closed") return false;
  const resolvedAt = conversation.resolved_at
    ? new Date(conversation.resolved_at).getTime()
    : new Date(conversation.updated_at).getTime();
  return nowMs - resolvedAt >= AI_OPS_REOPEN_AFTER_RESOLVED_MS;
}
