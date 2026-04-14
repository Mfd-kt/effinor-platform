"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["completed", "cancelled"] as const),
});

export type CompleteCallbackOutcomeResult = { ok: true } | { ok: false; error: string };

export async function completeCallbackOutcome(
  raw: z.infer<typeof schema>,
): Promise<CompleteCallbackOutcomeResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access) || access.kind !== "authenticated") {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." };
  }

  const now = new Date().toISOString();
  const supabase = await createClient();
  const patch =
    parsed.data.status === "completed"
      ? {
          status: parsed.data.status,
          last_call_at: now,
          completed_at: now,
          cancelled_at: null,
          call_started_at: null,
          in_progress_by_user_id: null,
        }
      : {
          status: parsed.data.status,
          last_call_at: now,
          cancelled_at: now,
          call_started_at: null,
          in_progress_by_user_id: null,
        };

  const { error } = await supabase.from("commercial_callbacks").update(patch).eq("id", parsed.data.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/agent");
  return { ok: true };
}
