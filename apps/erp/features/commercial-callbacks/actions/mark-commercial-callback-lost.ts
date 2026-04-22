"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ callbackId: z.string().uuid() });

export type MarkCommercialCallbackLostResult = { ok: true } | { ok: false; error: string };

/**
 * Clôture le rappel comme « perdu » : plus affiché dans les onglets actifs (pas de suppression logique).
 */
export async function markCommercialCallbackLost(
  raw: z.infer<typeof schema>,
): Promise<MarkCommercialCallbackLostResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Identifiant invalide." };
  }

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commercial_callbacks")
    .update({
      status: "lost",
      last_call_at: now,
      completed_at: now,
      cancelled_at: null,
      call_started_at: null,
      in_progress_by_user_id: null,
    })
    .eq("id", parsed.data.callbackId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.id) {
    return { ok: false, error: "Rappel introuvable ou déjà clôturé." };
  }

  revalidatePath("/commercial-callbacks");
  return { ok: true };
}
