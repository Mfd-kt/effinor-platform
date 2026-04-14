import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

type Admin = SupabaseClient<Database>;

const DIRECTION_ESCALATION_MIN_INTERVAL_MS = 24 * 3_600_000;

function escalationDedupeKey(conversationId: string, topicFingerprint: string): string {
  const fp = topicFingerprint.trim().slice(0, 64) || "general";
  return `ai_ops_esc_dir:${conversationId}:${fp}`;
}

/**
 * Une escalade direction par sujet / fenêtre 24h (hors contournement critique géré ailleurs).
 */
export async function canSendDirectionEscalation(
  admin: Admin,
  conversationId: string,
  topicFingerprint: string,
  nowMs: number,
): Promise<{ ok: boolean; reason?: string }> {
  const key = escalationDedupeKey(conversationId, topicFingerprint);
  const since = new Date(nowMs - DIRECTION_ESCALATION_MIN_INTERVAL_MS).toISOString();
  const { data } = await admin
    .from("ai_ops_logs")
    .select("id")
    .eq("dedupe_key", key)
    .eq("event_type", "ai_ops_escalation_direction")
    .gte("created_at", since)
    .limit(1);
  if ((data?.length ?? 0) > 0) {
    return { ok: false, reason: "escalation_recent" };
  }
  return { ok: true, reason: undefined };
}

export function buildDirectionEscalationDedupeKey(conversationId: string, topicFingerprint: string): string {
  return escalationDedupeKey(conversationId, topicFingerprint);
}
