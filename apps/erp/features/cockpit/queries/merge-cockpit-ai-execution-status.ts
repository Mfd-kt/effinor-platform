import type { SupabaseClient } from "@supabase/supabase-js";

import type { CockpitAiRecommendation } from "../types";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

export async function mergeCockpitAiExecutionStatuses(
  supabase: Supabase,
  actorUserId: string,
  recommendations: CockpitAiRecommendation[],
): Promise<CockpitAiRecommendation[]> {
  const ids = recommendations.map((r) => r.id);
  if (ids.length === 0) return recommendations;

  const { data, error } = await supabase
    .from("ai_action_logs")
    .select("recommendation_id, status, error_message, created_at")
    .eq("actor_user_id", actorUserId)
    .in("recommendation_id", ids)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return recommendations.map((r) => ({
      ...r,
      executionStatus: "idle",
      executionMessage: null,
    }));
  }

  const latest = new Map<string, { status: string; error_message: string | null }>();
  for (const row of data) {
    if (!latest.has(row.recommendation_id)) {
      latest.set(row.recommendation_id, { status: row.status, error_message: row.error_message });
    }
  }

  return recommendations.map((r) => {
    const l = latest.get(r.id);
    if (!l) {
      return { ...r, executionStatus: "idle" as const, executionMessage: null };
    }
    if (l.status === "pending") {
      return { ...r, executionStatus: "pending" as const, executionMessage: null };
    }
    if (l.status === "success") {
      return { ...r, executionStatus: "success" as const, executionMessage: null };
    }
    if (l.status === "failed") {
      return {
        ...r,
        executionStatus: "failed" as const,
        executionMessage: l.error_message?.trim() || "Échec — voir détail.",
      };
    }
    return { ...r, executionStatus: "idle" as const, executionMessage: null };
  });
}
