"use server";

import { revalidatePath } from "next/cache";

import { generateCallbackCallScript } from "@/features/commercial-callbacks/ai/generate-callback-call-script";
import type { CallbackAiExtra } from "@/features/commercial-callbacks/ai/callback-ai-types";
import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

export type RegenerateCallbackCallScriptResult =
  | { ok: true; source: "openai" | "fallback" }
  | { ok: false; error: string };

export async function regenerateCallbackCallScript(input: {
  callbackId: string;
  extra?: CallbackAiExtra;
}): Promise<RegenerateCallbackCallScriptResult> {
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
    const { scriptText, source } = await generateCallbackCallScript(row as CommercialCallbackRow, input.extra);
    const now = new Date().toISOString();

    const { error: updErr } = await supabase
      .from("commercial_callbacks")
      .update({
        ai_script_text: scriptText,
        ai_last_generated_at: now,
        updated_by_user_id: access.userId,
        updated_at: now,
      })
      .eq("id", input.callbackId);

    if (updErr) {
      console.error("[regenerateCallbackCallScript] update:", updErr);
      return { ok: false, error: "Impossible d’enregistrer le script. Réessayez." };
    }

    revalidatePath("/");
    return { ok: true, source };
  } catch (e) {
    console.error("[regenerateCallbackCallScript]", e);
    return {
      ok: false,
      error: "Génération impossible pour le moment. Vous pouvez réessayer ou utiliser le commentaire manuel.",
    };
  }
}
