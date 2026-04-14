"use server";

import { revalidatePath } from "next/cache";

import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import {
  RescheduleCommercialCallbackSchema,
  type RescheduleCommercialCallbackInput,
} from "@/features/commercial-callbacks/schemas/callback.schema";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

export type RescheduleCommercialCallbackResult = { ok: true } | { ok: false; error: string };

export async function rescheduleCommercialCallback(
  input: RescheduleCommercialCallbackInput,
): Promise<RescheduleCommercialCallbackResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = RescheduleCommercialCallbackSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("commercial_callbacks")
    .select("callback_comment")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? "Rappel introuvable." };
  }

  const stamp = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  const noteLine = parsed.data.note?.trim()
    ? `\n\n[Reporté le ${stamp}] ${parsed.data.note.trim()}`
    : `\n\n[Reporté le ${stamp}] Nouvelle échéance : ${parsed.data.callback_date}`;

  const { error } = await supabase
    .from("commercial_callbacks")
    .update({
      callback_date: parsed.data.callback_date,
      callback_time: parsed.data.callback_time ?? null,
      callback_time_window: parsed.data.callback_time_window ?? null,
      callback_comment: `${row.callback_comment}${noteLine}`,
      status: "pending",
      call_started_at: null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/agent");
  return { ok: true };
}
