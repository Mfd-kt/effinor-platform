import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import type { AiOpsConversationContext, AiOpsMessageType, AiOpsRoleTarget, AiOpsSenderType } from "./ai-ops-types";

type Supabase = SupabaseClient<Database>;

export async function buildAiOpsConversationContext(
  supabase: Supabase,
  conversationId: string,
): Promise<AiOpsConversationContext | null> {
  const { data: conv, error: cErr } = await supabase
    .from("ai_conversations")
    .select(
      "id, user_id, role_target, status, topic, priority, severity, entity_type, entity_id, metadata_json",
    )
    .eq("id", conversationId)
    .maybeSingle();
  if (cErr || !conv) return null;

  const { data: msgs, error: mErr } = await supabase
    .from("ai_messages")
    .select("sender_type, body, message_type, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(24);
  if (mErr) return null;

  const recentMessages = (msgs ?? []).reverse().map((m) => ({
    senderType: m.sender_type as AiOpsSenderType,
    body: m.body,
    messageType: m.message_type as AiOpsMessageType,
    createdAt: m.created_at,
  }));

  return {
    userId: conv.user_id,
    roleTarget: conv.role_target as AiOpsRoleTarget,
    conversationId: conv.id,
    status: conv.status as AiOpsConversationContext["status"],
    topic: conv.topic,
    priority: conv.priority,
    severity: conv.severity ?? "info",
    recentMessages,
    entityType: conv.entity_type,
    entityId: conv.entity_id,
    metadataJson: conv.metadata_json,
  };
}
