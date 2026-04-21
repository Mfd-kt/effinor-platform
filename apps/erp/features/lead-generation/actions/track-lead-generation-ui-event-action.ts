"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

type TrackLeadGenerationUiEventInput = {
  eventType: "my_queue_stale_return_shown";
  context?: Record<string, unknown>;
};

/**
 * Tracking produit best-effort : jamais bloquant côté UI.
 */
export async function trackLeadGenerationUiEventAction(input: TrackLeadGenerationUiEventInput): Promise<void> {
  try {
    const access = await getAccessContext();
    if (access.kind !== "authenticated") {
      return;
    }
    const supabase = await createClient();
    const { error } = await supabase.from("lead_generation_ui_events").insert({
      user_id: access.userId,
      event_type: input.eventType,
      context_json: input.context ?? {},
    });
    if (error) {
      console.warn("[lead-generation] ui event tracking failed:", error.message);
    }
  } catch (e) {
    console.warn("[lead-generation] ui event tracking exception:", e instanceof Error ? e.message : e);
  }
}
