"use server";

import { revalidatePath } from "next/cache";

import {
  canAccessCommercialCallbacksTeamOverview,
} from "@/features/commercial-callbacks/lib/callback-access";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

export type DeleteCommercialCallbackResult = { ok: true } | { ok: false; error: string };

/**
 * Suppression logique (soft delete) — réservée à la direction / admin CEE.
 */
export async function deleteCommercialCallback(
  callbackId: string,
): Promise<DeleteCommercialCallbackResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacksTeamOverview(access)) {
    return { ok: false, error: "Accès refusé." };
  }
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Session requise." };
  }

  const id = callbackId.trim();
  if (!id) {
    return { ok: false, error: "Identifiant manquant." };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("commercial_callbacks")
    .update({
      deleted_at: now,
      updated_by_user_id: access.userId,
      updated_at: now,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.id) {
    return { ok: false, error: "Rappel introuvable ou déjà supprimé." };
  }

  revalidatePath("/commercial-callbacks");
  revalidatePath("/agent");
  return { ok: true };
}
