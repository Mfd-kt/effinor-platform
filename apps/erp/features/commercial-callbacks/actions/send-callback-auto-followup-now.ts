"use server";

import { revalidatePath } from "next/cache";

import { sendCallbackAutoFollowup } from "@/features/commercial-callbacks/services/callback-auto-followup-service";
import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

export type SendCallbackAutoFollowupNowResult =
  | { ok: true; sent: boolean; message?: string }
  | { ok: false; error: string };

/**
 * Envoi immédiat (hors interrupteur cron global), sous réserve des règles métier.
 */
export async function sendCallbackAutoFollowupNow(callbackId: string): Promise<SendCallbackAutoFollowupNowResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("commercial_callbacks")
    .select("id")
    .eq("id", callbackId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? "Rappel introuvable." };
  }

  const res = await sendCallbackAutoFollowup(callbackId, { bypassGlobalCronSwitch: true });
  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  if (res.sent) {
    revalidatePath("/agent");
    return { ok: true, sent: true, message: "E-mail envoyé." };
  }

  revalidatePath("/agent");
  return { ok: true, sent: false, message: `Non envoyé : ${res.skipped}` };
}
