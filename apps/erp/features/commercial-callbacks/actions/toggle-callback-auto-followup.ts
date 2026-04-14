"use server";

import { revalidatePath } from "next/cache";

import { scheduleCallbackAutoFollowupIfNeeded } from "@/features/commercial-callbacks/services/callback-auto-followup-service";
import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

export type ToggleCallbackAutoFollowupResult = { ok: true } | { ok: false; error: string };

export async function toggleCallbackAutoFollowup(input: {
  callbackId: string;
  enabled: boolean;
}): Promise<ToggleCallbackAutoFollowupResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("commercial_callbacks")
    .update({
      auto_followup_enabled: input.enabled,
      updated_at: new Date().toISOString(),
      updated_by_user_id: access.userId,
    })
    .eq("id", input.callbackId)
    .is("deleted_at", null);

  if (error) {
    return { ok: false, error: error.message };
  }

  await scheduleCallbackAutoFollowupIfNeeded(input.callbackId);
  revalidatePath("/agent");
  return { ok: true };
}
