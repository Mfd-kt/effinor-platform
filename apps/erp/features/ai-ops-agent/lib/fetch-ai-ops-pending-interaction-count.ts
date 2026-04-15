import type { createClient } from "@/lib/supabase/client";

type SupabaseBrowser = Awaited<ReturnType<typeof createClient>>;

/**
 * Nombre de fils où l’agent attend une lecture ou une réponse (remarques / interactions).
 * Aligné sur l’onglet « En attente » : `awaiting_user`, ou `open`/`escalated` avec `awaiting_user_reply`.
 */
export async function fetchAiOpsPendingInteractionCount(
  supabase: SupabaseBrowser,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("ai_conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .or(
      "status.eq.awaiting_user,and(status.eq.open,awaiting_user_reply.eq.true),and(status.eq.escalated,awaiting_user_reply.eq.true)",
    )
    .not("status", "in", "(resolved,auto_closed,snoozed)");

  if (error) {
    return 0;
  }
  return count ?? 0;
}
