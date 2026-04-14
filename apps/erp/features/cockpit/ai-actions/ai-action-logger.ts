import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

export async function insertPendingAiActionLog(
  supabase: Supabase,
  input: {
    recommendationId: string;
    actionType: string;
    payloadJson: Json | null;
    actorUserId: string;
    executedBy: "user" | "ai";
    triggerSource?: string | null;
    reason?: string | null;
  },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("ai_action_logs")
    .insert({
      recommendation_id: input.recommendationId,
      action_type: input.actionType,
      payload_json: input.payloadJson,
      actor_user_id: input.actorUserId,
      executed_by: input.executedBy,
      status: "pending",
      result_json: null,
      error_message: null,
      trigger_source: input.triggerSource ?? null,
      reason: input.reason ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Journal IA indisponible." };
  }
  return { ok: true, id: data.id };
}

export async function finalizeAiActionLog(
  supabase: Supabase,
  input: {
    logId: string;
    status: "success" | "failed";
    resultJson: Json | null;
    errorMessage: string | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from("ai_action_logs")
    .update({
      status: input.status,
      result_json: input.resultJson,
      error_message: input.errorMessage,
    })
    .eq("id", input.logId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
