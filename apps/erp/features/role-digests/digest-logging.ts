import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database.types";

import type { RoleDigest } from "./digest-types";

type Supa = SupabaseClient<Database>;

export async function insertRoleDigestLog(
  supabase: Supa,
  input: {
    digestId: string | null;
    eventType: "generated" | "suppressed_duplicate" | "delivered" | "read" | "error";
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  await supabase.from("role_digest_logs").insert({
    digest_id: input.digestId,
    event_type: input.eventType,
    payload_json: (input.payload ?? {}) as Json,
  });
}

export async function persistRoleDigest(
  supabase: Supa,
  digest: RoleDigest,
  dedupeKey: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("role_digests")
    .insert({
      role_target: digest.roleTarget,
      target_user_id: digest.targetUserId!,
      digest_type: "in_app",
      priority: digest.priority,
      content_json: digest as unknown as Json,
      dedupe_key: dedupeKey,
      status: "generated",
    })
    .select("id")
    .single();
  if (error || !data) return null;
  await insertRoleDigestLog(supabase, {
    digestId: data.id,
    eventType: "generated",
    payload: { summary: digest.summary.slice(0, 200) },
  });
  return { id: data.id };
}

export async function logDigestSuppressedDuplicate(
  supabase: Supa,
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await insertRoleDigestLog(supabase, {
    digestId: null,
    eventType: "suppressed_duplicate",
    payload: { target_user_id: userId, ...payload },
  });
}
