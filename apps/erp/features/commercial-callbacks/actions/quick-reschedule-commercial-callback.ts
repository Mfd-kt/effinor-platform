"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import { computeQuickRescheduleParis } from "@/features/commercial-callbacks/lib/quick-reschedule-paris";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().uuid(),
  preset: z.enum([
    "plus_30m",
    "plus_1h",
    "plus_2h",
    "tomorrow_morning",
    "tomorrow_afternoon",
    "next_week",
  ]),
});

export type QuickRescheduleCommercialCallbackResult = { ok: true } | { ok: false; error: string };

export async function quickRescheduleCommercialCallback(
  raw: z.infer<typeof schema>,
): Promise<QuickRescheduleCommercialCallbackResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("commercial_callbacks")
    .select("callback_comment")
    .eq("id", parsed.data.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? "Rappel introuvable." };
  }

  const { callback_date, callback_time } = computeQuickRescheduleParis(parsed.data.preset);
  const stamp = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  const label = parsed.data.preset;
  const noteLine = `\n\n[Reporté le ${stamp}] Rapide : ${label} → ${callback_date}${callback_time ? ` ${callback_time}` : ""}`;

  const { error } = await supabase
    .from("commercial_callbacks")
    .update({
      callback_date,
      callback_time,
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
