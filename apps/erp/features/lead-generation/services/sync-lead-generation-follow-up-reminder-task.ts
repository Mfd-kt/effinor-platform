import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveAutomationPublicAppBaseUrl } from "@/features/automation/domain/config";
import { formatDateTimeFr } from "@/lib/format";

const TITLE_PREFIX = "Rappel relance Lead Gen —";

export type SyncLeadGenFollowUpReminderParams = {
  supabase: SupabaseClient;
  stockId: string;
  agentUserId: string;
  actorUserId: string;
  companyName: string;
  followUpAtIso: string | null;
};

/**
 * Annule les rappels ouverts pour cette fiche / agent, puis crée une tâche due 30 min avant la relance.
 */
export async function syncLeadGenerationFollowUpReminderTask(
  params: SyncLeadGenFollowUpReminderParams,
): Promise<void> {
  const { supabase, stockId, agentUserId, actorUserId, companyName, followUpAtIso } = params;
  const now = new Date();
  const nowIso = now.toISOString();

  await supabase
    .from("tasks")
    .update({ status: "cancelled", updated_at: nowIso })
    .eq("assigned_user_id", agentUserId)
    .eq("related_entity_type", "lead_generation_stock")
    .eq("related_entity_id", stockId)
    .in("status", ["open", "in_progress"])
    .like("title", `${TITLE_PREFIX}%`);

  if (!followUpAtIso) {
    return;
  }

  const followUp = new Date(followUpAtIso);
  if (Number.isNaN(followUp.getTime())) {
    return;
  }

  const remindAt = new Date(followUp.getTime() - 30 * 60 * 1000);
  const dueDate = remindAt.getTime() <= now.getTime() ? now : remindAt;

  const base = resolveAutomationPublicAppBaseUrl().replace(/\/$/, "");
  const url = `${base}/lead-generation/my-queue/${stockId}`;
  const safeName = companyName.trim().slice(0, 100) || "Prospect";

  const { error } = await supabase.from("tasks").insert({
    title: `${TITLE_PREFIX}${safeName}`,
    description: `Relance prévue : ${formatDateTimeFr(followUpAtIso)}\n\nOuvrir la fiche :\n${url}`,
    task_type: "follow_up",
    priority: "normal",
    status: "open",
    due_date: dueDate.toISOString(),
    assigned_user_id: agentUserId,
    created_by_user_id: actorUserId,
    related_entity_type: "lead_generation_stock",
    related_entity_id: stockId,
  });

  if (error) {
    throw new Error(`Tâche de rappel Lead Gen : ${error.message}`);
  }
}
