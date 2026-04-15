"use server";

import { randomUUID } from "crypto";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAccessContext } from "@/lib/auth/access-context";
import { hasRole } from "@/lib/auth/role-codes";
import type { Json } from "@/types/database.types";

import { logAiOpsEvent } from "../services/persist-ai-ops";

export type CreateUserHelpConversationResult =
  | { ok: true; conversationId: string }
  | { ok: false; error: string };

function roleTargetForAccess(roleCodes: readonly string[]): string {
  if (hasRole(roleCodes, "sales_agent")) return "agent";
  if (hasRole(roleCodes, "confirmer")) return "confirmateur";
  if (hasRole(roleCodes, "closer")) return "closer";
  if (hasRole(roleCodes, "sales_director")) return "direction";
  if (hasRole(roleCodes, "technician")) return "commercial";
  return "commercial";
}

/**
 * Nouveau fil « aide » : questions techniques, utilisation ERP, explications (réponses IA via OpenAI).
 */
export async function createUserHelpConversation(): Promise<CreateUserHelpConversationResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié." };
  }

  const admin = createAdminClient();
  const dedupeKey = `user_help_${randomUUID()}`;
  const roleTarget = roleTargetForAccess(access.roleCodes);
  const now = new Date().toISOString();

  const { data: conv, error: cErr } = await admin
    .from("ai_conversations")
    .insert({
      user_id: access.userId,
      role_target: roleTarget,
      status: "open",
      topic: "Aide — questions à l’assistant Effinor",
      priority: "normal",
      severity: "info",
      issue_type: "user_help",
      dedupe_key: dedupeKey,
      awaiting_user_reply: false,
      metadata_json: { assistant_chat: true } as Json,
      updated_at: now,
    })
    .select("id")
    .single();

  if (cErr || !conv) {
    return { ok: false, error: cErr?.message ?? "Impossible de créer la conversation." };
  }

  const welcome =
    "Bonjour — je peux t’aider sur l’utilisation d’Effinor ERP (navigation, workflows, visites techniques, leads, etc.). " +
    "Pose ta question ci-dessous (technique, procédure ou « comment faire pour… »).";

  const { error: mErr } = await admin.from("ai_messages").insert({
    conversation_id: conv.id,
    sender_type: "ai",
    sender_user_id: null,
    message_type: "reply",
    body: welcome,
    metadata_json: { user_help_welcome: true } as Json,
    requires_action: false,
  });

  if (mErr) {
    await admin.from("ai_conversations").delete().eq("id", conv.id);
    return { ok: false, error: mErr.message };
  }

  await logAiOpsEvent(admin, {
    conversationId: conv.id,
    targetUserId: access.userId,
    eventType: "ai_ops_user_help_opened",
    channel: "in_app",
    payloadJson: {} as Json,
  });

  revalidatePath("/agent-operations");
  return { ok: true, conversationId: conv.id };
}
