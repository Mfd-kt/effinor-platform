"use server";

import { revalidatePath } from "next/cache";

import { sendInitialCallbackEmail } from "@/features/commercial-callbacks/actions/send-initial-callback-email";
import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import {
  CreateCommercialCallbackSchema,
  type CreateCommercialCallbackInput,
} from "@/features/commercial-callbacks/schemas/callback.schema";
import { getAccessContext } from "@/lib/auth/access-context";
import { hasFullCeeWorkflowAccess } from "@/lib/auth/cee-workflows-scope";
import { createClient } from "@/lib/supabase/server";

export type CreateCommercialCallbackResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createCommercialCallback(
  input: CreateCommercialCallbackInput,
): Promise<CreateCommercialCallbackResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access)) {
    return { ok: false, error: "Accès refusé." };
  }
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Session requise." };
  }

  const parsed = CreateCommercialCallbackSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const requested = parsed.data.assigned_agent_user_id?.trim() || null;
  const assigned = requested || access.userId;
  if (!hasFullCeeWorkflowAccess(access) && assigned !== access.userId) {
    return { ok: false, error: "Seuls les pilotes peuvent assigner un rappel à un autre collaborateur." };
  }
  const createdBy = access.userId;

  const est = parsed.data.estimated_value_eur;
  const estimated_value_cents =
    est == null || Number.isNaN(est) ? null : Math.round(est * 100);

  const { data, error } = await supabase
    .from("commercial_callbacks")
    .insert({
      company_name: parsed.data.company_name.trim(),
      contact_name: parsed.data.contact_name.trim(),
      phone: parsed.data.phone.trim(),
      email: parsed.data.email?.trim() || null,
      callback_date: parsed.data.callback_date,
      callback_time: parsed.data.callback_time ?? null,
      callback_time_window: parsed.data.callback_time_window ?? null,
      callback_comment: parsed.data.callback_comment.trim(),
      priority: parsed.data.priority ?? "normal",
      source: parsed.data.source?.trim() || null,
      assigned_agent_user_id: assigned,
      created_by_user_id: createdBy,
      status: "pending",
      call_context_summary: parsed.data.call_context_summary?.trim() || null,
      prospect_temperature: parsed.data.prospect_temperature ?? null,
      estimated_value_cents,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.id) {
    return { ok: false, error: "Création impossible." };
  }

  revalidatePath("/commercial-callbacks");

  try {
    const emailResult = await sendInitialCallbackEmail(data.id);
    if (!emailResult.ok) {
      console.error(
        "[createCommercialCallback] initial email:",
        data.id,
        emailResult.error,
      );
    }
  } catch (e) {
    console.error("[createCommercialCallback] initial email:", data.id, e);
  }

  return { ok: true, id: data.id };
}
