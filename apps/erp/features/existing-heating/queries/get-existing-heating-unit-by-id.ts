import { createClient } from "@/lib/supabase/server";

import type { ExistingHeatingDetailRow } from "@/features/existing-heating/types";

export async function getExistingHeatingUnitById(id: string): Promise<ExistingHeatingDetailRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("existing_heating_units")
    .select(
      `
      *,
      heating_models (
        id,
        brand,
        model,
        type,
        energy,
        power_kw
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de charger l’unité : ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return data as unknown as ExistingHeatingDetailRow;
}
