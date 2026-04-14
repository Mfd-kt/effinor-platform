"use server";

import { revalidatePath } from "next/cache";

import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

export type AbandonCommercialCallbackCallResult = { ok: true } | { ok: false; error: string };

/** Annule la session « en appel » sans clôturer le rappel (retour à l’état précédent). */
export async function abandonCommercialCallbackCall(raw: {
  id: string;
}): Promise<AbandonCommercialCallbackCallResult> {
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

  if (row.status !== "in_progress") {
    return { ok: true };
  }

  const { error } = await supabase
    .from("commercial_callbacks")
    .update({
      status: "pending",
      call_started_at: null,
    })
    .eq("id", raw.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/agent");
  return { ok: true };
}
