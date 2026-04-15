import type { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

import {
  buildFallbackUserHelpReply,
  getErpAssistantModel,
  getErpAssistantOpenAI,
  getErpAssistantSystemPrompt,
} from "./erp-assistant-openai";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Après insertion du message utilisateur : génère la réponse IA (OpenAI) et l’enregistre.
 */
export async function completeUserHelpTurn(
  admin: Admin,
  conversationId: string,
  lastUserPreview: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: rows, error: mErr } = await admin
    .from("ai_messages")
    .select("sender_type, body")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(48);

  if (mErr) return { ok: false, error: mErr.message };

  const openai = getErpAssistantOpenAI();
  const model = getErpAssistantModel();
  const system = getErpAssistantSystemPrompt();

  type ChatRole = "user" | "assistant" | "system";
  const messages: { role: ChatRole; content: string }[] = [{ role: "system", content: system }];

  for (const m of rows ?? []) {
    if (m.sender_type === "user") {
      messages.push({ role: "user", content: m.body });
    } else if (m.sender_type === "ai") {
      messages.push({ role: "assistant", content: m.body });
    }
  }

  let replyBody: string;
  if (!openai) {
    replyBody = buildFallbackUserHelpReply(lastUserPreview);
  } else {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: 1400,
        temperature: 0.35,
      });
      const text = completion.choices[0]?.message?.content?.trim();
      replyBody = text && text.length > 0 ? text : buildFallbackUserHelpReply(lastUserPreview);
    } catch {
      replyBody = buildFallbackUserHelpReply(lastUserPreview);
    }
  }

  const nowIso = new Date().toISOString();
  const { error: aiErr } = await admin.from("ai_messages").insert({
    conversation_id: conversationId,
    sender_type: "ai",
    sender_user_id: null,
    message_type: "reply",
    body: replyBody,
    metadata_json: { user_help: true, model: openai ? model : "fallback" } as Json,
    requires_action: false,
  });
  if (aiErr) return { ok: false, error: aiErr.message };

  const { error: uErr } = await admin
    .from("ai_conversations")
    .update({
      status: "open",
      awaiting_user_reply: false,
      updated_at: nowIso,
      last_ai_message_at: nowIso,
    })
    .eq("id", conversationId);

  if (uErr) return { ok: false, error: uErr.message };

  return { ok: true };
}
