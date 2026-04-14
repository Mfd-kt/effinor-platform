import type { ExistingHeatingFormInput } from "@/features/existing-heating/schemas/existing-heating.schema";
import type { ExistingHeatingDetailRow, ExistingHeatingUnitRow } from "@/features/existing-heating/types";

export const EMPTY_EXISTING_HEATING_FORM: ExistingHeatingFormInput = {
  heating_model_id: "",
  quantity: 1,
  unit_power_kw: undefined,
  total_power_kw: undefined,
  notes: undefined,
};

export function existingHeatingRowToFormValues(
  row: ExistingHeatingUnitRow | ExistingHeatingDetailRow,
): ExistingHeatingFormInput {
  return {
    heating_model_id: row.heating_model_id,
    quantity: row.quantity,
    unit_power_kw: row.unit_power_kw ?? undefined,
    total_power_kw: row.total_power_kw ?? undefined,
    notes: row.notes ?? undefined,
  };
}
