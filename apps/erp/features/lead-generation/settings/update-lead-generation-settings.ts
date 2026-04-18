import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

import type { LeadGenerationSettingsKey } from "./default-settings";
import { parseLeadGenerationSettingByKey } from "./parse-lead-generation-settings";

export async function updateLeadGenerationSettings(input: {
  key: LeadGenerationSettingsKey;
  value: unknown;
  updatedByUserId: string;
}) {
  const parsed = parseLeadGenerationSettingByKey(input.key, input.value);
  if (!parsed.valid) {
    throw new Error("Valeur de réglage invalide.");
  }

  const supabase = await createClient();
  const table = lgTable(supabase, "lead_generation_settings");
  const { data, error } = await table
    .upsert(
      {
        key: input.key,
        value: parsed.value,
        updated_by_user_id: input.updatedByUserId,
      } as never,
      { onConflict: "key" },
    )
    .select("key, value, updated_at, updated_by_user_id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de sauvegarder le réglage.");
  }

  return data as {
    key: LeadGenerationSettingsKey;
    value: unknown;
    updated_at: string;
    updated_by_user_id: string | null;
  };
}
