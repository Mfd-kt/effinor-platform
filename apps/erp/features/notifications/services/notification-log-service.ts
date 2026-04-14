import { createClient } from "@/lib/supabase/server";

import type { NotificationLogStatus, NotificationProvider } from "@/features/notifications/domain/types";
import type { Json } from "@/types/database.types";

export type NotificationLogInsert = {
  channel: string;
  provider: NotificationProvider;
  status: NotificationLogStatus;
  eventType?: string;
  entityType?: string;
  entityId?: string;
  payloadJson?: Record<string, unknown>;
  errorMessage?: string | null;
};

/**
 * Persistance best-effort : si la table n’existe pas ou RLS bloque, on loggue en console et on continue.
 */
export async function insertNotificationLog(row: NotificationLogInsert): Promise<void> {
  try {
    const supabase = await createClient();
    const payloadJson = (row.payloadJson ?? null) as Json | undefined;

    const { error } = await supabase.from("notification_logs").insert({
      channel: row.channel,
      provider: row.provider,
      status: row.status,
      event_type: row.eventType ?? null,
      entity_type: row.entityType ?? null,
      entity_id: row.entityId ?? null,
      payload_json: payloadJson ?? null,
      error_message: row.errorMessage ?? null,
    });
    if (error) {
      console.warn("[notifications] insertNotificationLog failed:", error.message);
    }
  } catch (e) {
    console.warn("[notifications] insertNotificationLog exception:", e instanceof Error ? e.message : e);
  }
}
