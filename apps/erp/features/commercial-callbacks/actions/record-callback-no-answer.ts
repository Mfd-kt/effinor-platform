"use server";

import { revalidatePath } from "next/cache";

import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

const NO_ANSWER_BEFORE_COLD = 3;

export type RecordCallbackNoAnswerResult = { ok: true; attempts: number; status: string } | { ok: false; error: string };

export async function recordCallbackNoAnswer(raw: { id: string }): Promise<RecordCallbackNoAnswerResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("commercial_callbacks")
    .select("id, attempts_count, callback_comment, status")
    .eq("id", raw.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? "Rappel introuvable." };
  }

  const nextAttempts = (row.attempts_count ?? 0) + 1;
  const status = nextAttempts >= NO_ANSWER_BEFORE_COLD ? "cold_followup" : "no_answer";
  const stamp = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  const line = `\n\n[Sans réponse le ${stamp}] Tentative ${nextAttempts}/${NO_ANSWER_BEFORE_COLD}.`;

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("commercial_callbacks")
    .update({
      attempts_count: nextAttempts,
      status,
      last_call_at: now,
      call_started_at: null,
      callback_comment: `${row.callback_comment}${line}`,
    })
    .eq("id", raw.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  return { ok: true, attempts: nextAttempts, status };
}
