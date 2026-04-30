"use server";

import { revalidatePath } from "next/cache";

import { LeadActivityEventInsertSchema } from "@/features/leads/schemas/lead-conversion.schema";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

export type InsertLeadActivityEventResult =
  | { ok: true; eventId: string }
  | { ok: false; error: string };

export async function insertLeadActivityEvent(input: unknown): Promise<InsertLeadActivityEventResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" };
  }

  const parsed = LeadActivityEventInsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides." };
  }

  const supabase = await createClient();

  const payload = {
    lead_id: parsed.data.lead_id,
    event_type: parsed.data.event_type,
    metadata: parsed.data.metadata,
    actor_user_id: parsed.data.actor_user_id ?? access.userId,
  };

  const { data, error } = await supabase
    .from("lead_activity_events")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data?.id) {
    return { ok: false, error: error?.message ?? "Échec de l'enregistrement de l'événement." };
  }

  revalidatePath(`/leads/${parsed.data.lead_id}`);

  return { ok: true, eventId: data.id };
}
