import { createClient } from "@/lib/supabase/server";

import { formatHeatingModelLabel } from "@/features/existing-heating/constants";
import type { ExistingHeatingFormOptions } from "@/features/existing-heating/types";

/**
 * Catalogue des modèles de chauffage pour les sélecteurs.
 */
export async function getExistingHeatingFormOptions(): Promise<ExistingHeatingFormOptions> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("heating_models")
    .select("id, brand, model, type, power_kw")
    .order("brand", { ascending: true })
    .order("model", { ascending: true })
    .limit(5000);

  if (error) {
    throw new Error(`Modèles de chauffage : ${error.message}`);
  }

  const heatingModels = (data ?? []).map((m) => ({
    id: m.id,
    brand: m.brand,
    model: m.model,
    type: m.type,
    power_kw: m.power_kw,
    label: formatHeatingModelLabel({
      brand: m.brand,
      model: m.model,
      power_kw: m.power_kw,
    }),
  }));

  return { heatingModels };
}
