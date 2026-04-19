import type { SupabaseClient } from "@supabase/supabase-js";

import { lgTable } from "../lib/lg-db";

/**
 * Supprime une fiche stock et les tâches `lead_generation_stock` associées (pas de contrôle métier).
 */
export async function removeLeadGenerationStockAndTasks(
  supabase: SupabaseClient,
  stockId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error: taskErr } = await supabase
    .from("tasks")
    .delete()
    .eq("related_entity_type", "lead_generation_stock")
    .eq("related_entity_id", stockId);

  if (taskErr) {
    return { ok: false, message: `Tâches liées : ${taskErr.message}` };
  }

  const stockTable = lgTable(supabase, "lead_generation_stock");
  const { error: delErr } = await stockTable.delete().eq("id", stockId);

  if (delErr) {
    return { ok: false, message: delErr.message };
  }

  return { ok: true };
}
