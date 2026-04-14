import { createClient } from "@/lib/supabase/server";

import { formatHeatingModelLabel } from "@/features/existing-heating/constants";
import type { ExistingHeatingListRow, ExistingHeatingUnitRow } from "@/features/existing-heating/types";

export type ExistingHeatingListFilters = {
  q?: string;
  heating_model_id?: string;
};

type RawRow = ExistingHeatingUnitRow & {
  heating_models: {
    brand: string;
    model: string;
    power_kw: number | null;
  } | null;
};

function normalize(raw: RawRow): ExistingHeatingListRow {
  const { heating_models, ...rest } = raw;
  const hm = heating_models;
  return {
    ...rest,
    heating_model_label: hm
      ? formatHeatingModelLabel({
          brand: hm.brand,
          model: hm.model,
          power_kw: hm.power_kw,
        })
      : "—",
  };
}

export async function getExistingHeatingUnits(
  filters?: ExistingHeatingListFilters,
): Promise<ExistingHeatingListRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("existing_heating_units")
    .select(
      `
      *,
      heating_models (
        brand,
        model,
        power_kw
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (filters?.heating_model_id?.trim()) {
    query = query.eq("heating_model_id", filters.heating_model_id.trim());
  }

  if (filters?.q?.trim()) {
    const term = `%${filters.q.trim().replace(/,/g, " ")}%`;
    query = query.ilike("notes", term);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible de charger le chauffage existant : ${error.message}`);
  }

  return (data as unknown as RawRow[] | null)?.map(normalize) ?? [];
}
