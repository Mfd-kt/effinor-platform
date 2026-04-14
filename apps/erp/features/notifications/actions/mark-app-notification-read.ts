"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

export async function markAppNotificationRead(notificationId: string): Promise<{ ok: boolean }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("app_notifications")
    .update({ is_read: true, read_at: now })
    .eq("id", notificationId)
    .eq("user_id", access.userId);

  if (error) {
    return { ok: false };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllAppNotificationsRead(): Promise<{ ok: boolean }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("app_notifications")
    .update({ is_read: true, read_at: now })
    .eq("user_id", access.userId)
    .eq("is_read", false);

  if (error) {
    return { ok: false };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
