import type { Database } from "@/types/database.types";

import type { ExistingHeatingInsertInput } from "@/features/existing-heating/schemas/existing-heating.schema";

type ExistingHeatingInsert = Database["public"]["Tables"]["existing_heating_units"]["Insert"];
type ExistingHeatingUpdate = Database["public"]["Tables"]["existing_heating_units"]["Update"];

function trimOrNull(v: string | undefined): string | null {
  if (v === undefined) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function insertFromExistingHeatingForm(data: ExistingHeatingInsertInput): ExistingHeatingInsert {
  return {
    heating_model_id: data.heating_model_id,
    quantity: data.quantity,
    unit_power_kw: data.unit_power_kw ?? null,
    total_power_kw: data.total_power_kw ?? null,
    notes: trimOrNull(data.notes),
  };
}

export function updateFromExistingHeatingForm(data: ExistingHeatingInsertInput): ExistingHeatingUpdate {
  const patch: ExistingHeatingUpdate = {};

  if (data.heating_model_id !== undefined) patch.heating_model_id = data.heating_model_id;
  if (data.quantity !== undefined) patch.quantity = data.quantity;
  if (data.unit_power_kw !== undefined) patch.unit_power_kw = data.unit_power_kw ?? null;
  if (data.total_power_kw !== undefined) patch.total_power_kw = data.total_power_kw ?? null;
  if (data.notes !== undefined) patch.notes = trimOrNull(data.notes);

  return patch;
}
