"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

import { postAiOpsQuickReply } from "./post-ai-ops-user-message";
import { logAiOpsEvent } from "../services/persist-ai-ops";

export type AiOpsActionResult = { ok: true } | { ok: false; error: string };

function addHours(d: Date, h: number): Date {
  return new Date(d.getTime() + h * 3_600_000);
}

function nextLocalDayAt(hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function nextMondayMorning(): Date {
  const d = new Date();
  const day = d.getDay();
  const add = day === 0 ? 1 : day === 6 ? 2 : 8 - day;
  d.setDate(d.getDate() + add);
  d.setHours(9, 0, 0, 0);
  return d;
}

export async function resolveAiOpsConversationAction(conversationId: string, reason?: string): Promise<AiOpsActionResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") return { ok: false, error: "Non authentifié." };
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("ai_conversations")
    .update({
      status: "resolved",
      resolved_at: now,
      awaiting_user_reply: false,
      snoozed_until: null,
      cooldown_until: null,
      updated_at: now,
    })
    .eq("id", conversationId)
    .eq("user_id", access.userId);
  if (error) return { ok: false, error: error.message };
  const admin = createAdminClient();
  await logAiOpsEvent(admin, {
    conversationId,
    targetUserId: access.userId,
    eventType: "ai_ops_user_resolve",
    channel: "in_app",
    payloadJson: { reason: reason ?? "manual" } as Json,
  });
  revalidatePath("/agent-operations");
  return { ok: true };
}

export async function snoozeAiOpsConversationAction(
  conversationId: string,
  preset: "1h" | "4h" | "tomorrow" | "week",
): Promise<AiOpsActionResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") return { ok: false, error: "Non authentifié." };
  const supabase = await createClient();
  const now = new Date();
  let until: Date;
  switch (preset) {
    case "1h":
      until = addHours(now, 1);
      break;
    case "4h":
      until = addHours(now, 4);
      break;
    case "tomorrow":
      until = nextLocalDayAt(9);
      break;
    case "week":
      until = nextMondayMorning();
      break;
    default:
      until = addHours(now, 4);
  }
  const iso = until.toISOString();
  const { error } = await supabase
    .from("ai_conversations")
    .update({
      status: "snoozed",
      snoozed_until: iso,
      awaiting_user_reply: false,
      updated_at: now.toISOString(),
    })
    .eq("id", conversationId)
    .eq("user_id", access.userId);
  if (error) return { ok: false, error: error.message };
  const admin = createAdminClient();
  await logAiOpsEvent(admin, {
    conversationId,
    targetUserId: access.userId,
    eventType: "ai_ops_snooze_applied",
    channel: "in_app",
    payloadJson: { preset, until: iso } as Json,
  });
  revalidatePath("/agent-operations");
  return { ok: true };
}

export async function escalateAiOpsConversationAction(conversationId: string): Promise<AiOpsActionResult> {
  return postAiOpsQuickReply(conversationId, "escalate");
}
