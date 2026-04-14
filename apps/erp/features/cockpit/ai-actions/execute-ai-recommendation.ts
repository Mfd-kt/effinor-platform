"use server";

import { z } from "zod";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessCommandCockpit } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import { finalizeAiActionLog, insertPendingAiActionLog } from "./ai-action-logger";
import { runAiActionHandler } from "./ai-action-handlers";
import { resolveAiActionForExecute } from "./map-recommendation-action";

const schema = z.string().min(1);

export type ExecuteAiRecommendationResponse =
  | { ok: true; message: string; clientRedirect?: string; openTel?: string }
  | { ok: false; message: string };

/**
 * Exécute une recommandation cockpit (direction uniquement). Toujours journalisée (pending → success | failed).
 */
export async function executeAiRecommendation(recommendationIdRaw: string): Promise<ExecuteAiRecommendationResponse> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessCommandCockpit(access)) {
    return { ok: false, message: "Action réservée à la direction." };
  }

  const parsedId = schema.safeParse(recommendationIdRaw);
  if (!parsedId.success) {
    return { ok: false, message: "Recommandation invalide." };
  }

  const recommendationId = parsedId.data;
  const supabase = await createClient();
  const resolved = await resolveAiActionForExecute(supabase, recommendationId);
  if (!resolved) {
    return { ok: false, message: "Aucune action pour cette recommandation." };
  }

  const pending = await insertPendingAiActionLog(supabase, {
    recommendationId,
    actionType: resolved.actionType,
    payloadJson: resolved.payload,
    actorUserId: access.userId,
    executedBy: "user",
  });
  if (!pending.ok) {
    return { ok: false, message: pending.error };
  }

  const logId = pending.id;

  try {
    const result = await runAiActionHandler(
      { supabase, access, actorUserId: access.userId },
      resolved.actionType,
      resolved.payload,
    );

    if (!result.ok) {
      await finalizeAiActionLog(supabase, {
        logId,
        status: "failed",
        resultJson: null,
        errorMessage: result.error,
      });
      return { ok: false, message: `Échec — ${result.error}` };
    }

    const fin = await finalizeAiActionLog(supabase, {
      logId,
      status: "success",
      resultJson: result.resultJson ?? null,
      errorMessage: null,
    });
    if (!fin.ok) {
      return { ok: false, message: `Échec — ${fin.error}` };
    }

    let message = "Action exécutée.";
    if (resolved.actionType === "call_callback") {
      message = "Action exécutée — ouverture de l’appel.";
    } else if (resolved.actionType === "open_lead" || resolved.actionType === "view_automation") {
      message = "Action exécutée — redirection.";
    } else if (resolved.actionType === "convert_callback") {
      message = "Action exécutée — rappel converti.";
    }

    return {
      ok: true,
      message,
      clientRedirect: result.clientRedirect,
      openTel: result.openTel,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inattendue.";
    await finalizeAiActionLog(supabase, {
      logId,
      status: "failed",
      resultJson: null,
      errorMessage: msg,
    });
    return { ok: false, message: `Échec — ${msg}` };
  }
}
