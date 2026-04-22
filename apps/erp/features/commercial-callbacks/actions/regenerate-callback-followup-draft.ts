"use server";

import { revalidatePath } from "next/cache";

import { generateCallbackFollowupDraft } from "@/features/commercial-callbacks/ai/generate-callback-followup-draft";
import type { CallbackAiExtra } from "@/features/commercial-callbacks/ai/callback-ai-types";
import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

export type RegenerateCallbackFollowupDraftResult =
  | { ok: true; source: "openai" | "fallback" }
  | { ok: false; error: string };

export async function regenerateCallbackFollowupDraft(input: {
  callbackId: string;
  extra?: CallbackAiExtra;
}): Promise<RegenerateCallbackFollowupDraftResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("commercial_callbacks")
    .select("*")
    .eq("id", input.callbackId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? "Rappel introuvable." };
  }

  try {
    const { draftText, source } = await generateCallbackFollowupDraft(row as CommercialCallbackRow, input.extra);
    const now = new Date().toISOString();

    const { error: updErr } = await supabase
      .from("commercial_callbacks")
      .update({
        ai_followup_draft: draftText,
        ai_last_generated_at: now,
        updated_by_user_id: access.userId,
        updated_at: now,
      })
      .eq("id", input.callbackId);

    if (updErr) {
      console.error("[regenerateCallbackFollowupDraft] update:", updErr);
      return { ok: false, error: "Impossible d’enregistrer le brouillon. Réessayez." };
    }

    revalidatePath("/");
    return { ok: true, source };
  } catch (e) {
    console.error("[regenerateCallbackFollowupDraft]", e);
    return {
      ok: false,
      error: "Génération impossible pour le moment. Réessayez plus tard.",
    };
  }
}
