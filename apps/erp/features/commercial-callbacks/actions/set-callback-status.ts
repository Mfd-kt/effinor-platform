"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import { CALLBACK_STATUSES } from "@/features/commercial-callbacks/domain/callback-status";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(CALLBACK_STATUSES),
});

export type SetCallbackStatusResult = { ok: true } | { ok: false; error: string };

export async function setCommercialCallbackStatus(
  raw: z.infer<typeof schema>,
): Promise<SetCallbackStatusResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("commercial_callbacks")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  return { ok: true };
}
