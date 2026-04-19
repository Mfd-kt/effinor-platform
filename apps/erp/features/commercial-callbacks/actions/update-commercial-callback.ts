"use server";

import { revalidatePath } from "next/cache";

import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import {
  UpdateCommercialCallbackSchema,
  type UpdateCommercialCallbackInput,
} from "@/features/commercial-callbacks/schemas/callback.schema";
import { getAccessContext } from "@/lib/auth/access-context";
import { hasFullCeeWorkflowAccess } from "@/lib/auth/cee-workflows-scope";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type CommercialCallbackUpdate = Database["public"]["Tables"]["commercial_callbacks"]["Update"];

export type UpdateCommercialCallbackResult = { ok: true } | { ok: false; error: string };

export async function updateCommercialCallback(
  input: UpdateCommercialCallbackInput,
): Promise<UpdateCommercialCallbackResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = UpdateCommercialCallbackSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Données invalides." };
  }

  const { id, ...rest } = parsed.data;
  const patch: CommercialCallbackUpdate = {};
  if (rest.company_name !== undefined) patch.company_name = rest.company_name.trim();
  if (rest.contact_name !== undefined) patch.contact_name = rest.contact_name.trim();
  if (rest.phone !== undefined) patch.phone = rest.phone.trim();
  if (rest.email !== undefined) patch.email = rest.email?.trim() || null;
  if (rest.callback_date !== undefined) patch.callback_date = rest.callback_date;
  if (rest.callback_time !== undefined) patch.callback_time = rest.callback_time ?? null;
  if (rest.callback_time_window !== undefined) patch.callback_time_window = rest.callback_time_window;
  if (rest.callback_comment !== undefined) patch.callback_comment = rest.callback_comment.trim();
  if (rest.priority !== undefined) patch.priority = rest.priority;
  if (rest.source !== undefined) patch.source = rest.source?.trim() || null;
  if (rest.status !== undefined) patch.status = rest.status;
  if (rest.call_context_summary !== undefined) {
    patch.call_context_summary = rest.call_context_summary?.trim() || null;
  }
  if (rest.prospect_temperature !== undefined) {
    patch.prospect_temperature = rest.prospect_temperature ?? null;
  }
  if (rest.estimated_value_eur !== undefined) {
    const est = rest.estimated_value_eur;
    patch.estimated_value_cents =
      est == null || Number.isNaN(est) ? null : Math.round(est * 100);
  }

  if (rest.assigned_agent_user_id !== undefined) {
    const nextAssignee = rest.assigned_agent_user_id?.trim() || null;
    if (!nextAssignee) {
      return { ok: false, error: "L’agent assigné est obligatoire — choisissez un collaborateur." };
    }
    const isPilot = hasFullCeeWorkflowAccess(access);
    if (!isPilot && nextAssignee !== access.userId) {
      return { ok: false, error: "Vous ne pouvez réassigner un rappel qu’à vous-même." };
    }
    patch.assigned_agent_user_id = nextAssignee;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Aucune modification." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("commercial_callbacks").update(patch).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/agent");
  revalidatePath("/commercial-callbacks");
  return { ok: true };
}
