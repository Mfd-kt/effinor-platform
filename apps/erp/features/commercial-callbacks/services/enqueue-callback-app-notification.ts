import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export type AppNotificationSeverity = "info" | "warning" | "high" | "critical";

/**
 * Insertion notification in-app (service_role). Déduplication via dedupe_key unique.
 */
export async function enqueueCallbackAppNotification(input: {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  severity: AppNotificationSeverity;
  entityId: string;
  actionUrl?: string | null;
  dedupeKey: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("app_notifications")
    .select("id")
    .eq("user_id", input.userId)
    .eq("dedupe_key", input.dedupeKey)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true };
  }

  const now = new Date().toISOString();
  const { error } = await admin.from("app_notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    severity: input.severity,
    entity_type: "commercial_callback",
    entity_id: input.entityId,
    action_url: input.actionUrl ?? (input.entityId ? `/agent?callback=${input.entityId}` : "/agent"),
    is_read: false,
    is_dismissed: false,
    metadata_json: (input.metadata ?? null) as Json,
    delivered_at: now,
    dedupe_key: input.dedupeKey,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
