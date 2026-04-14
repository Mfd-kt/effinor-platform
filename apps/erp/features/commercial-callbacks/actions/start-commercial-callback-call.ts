"use server";

import { revalidatePath } from "next/cache";

import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

const STARTABLE = new Set([
  "pending",
  "due_today",
  "overdue",
  "rescheduled",
  "no_answer",
  "cold_followup",
]);

export type StartCommercialCallbackCallResult = { ok: true } | { ok: false; error: string };

export async function startCommercialCallbackCall(raw: {
  id: string;
}): Promise<StartCommercialCallbackCallResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("commercial_callbacks")
    .select("id, status")
    .eq("id", raw.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? "Rappel introuvable." };
  }

  if (row.status === "in_progress") {
    return { ok: true };
  }
  if (!STARTABLE.has(row.status)) {
    return { ok: false, error: "Ce rappel ne peut pas être démarré." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("commercial_callbacks")
    .update({
      status: "in_progress",
      call_started_at: now,
      in_progress_by_user_id: access.userId,
    })
    .eq("id", raw.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/agent");
  return { ok: true };
}
