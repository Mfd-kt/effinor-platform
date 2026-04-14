import type { OperationSiteFormInput } from "@/features/operation-sites/schemas/operation-site.schema";
import type { OperationSiteDetailRow, OperationSiteRow } from "@/features/operation-sites/types";

export const EMPTY_OPERATION_SITE_FORM: OperationSiteFormInput = {
  operation_id: "",
  label: "",
  sequence_number: undefined,
  is_primary: false,
  site_kind: "",
  activity_type: undefined,
  building_type: undefined,
  dedicated_building: undefined,
  climate_zone: undefined,
  operating_mode: undefined,
  height_m: undefined,
  volume_m3: undefined,
  area_m2: undefined,
  flow_type: undefined,
  heating_system_type: undefined,
  convective_power_kw: undefined,
  radiant_power_kw: undefined,
  calculated_power_kw: undefined,
  air_flow_required_m3h: undefined,
  destratifier_quantity_required: undefined,
  notes: undefined,
};

export function operationSiteRowToFormValues(
  row: OperationSiteRow | OperationSiteDetailRow,
): OperationSiteFormInput {
  return {
    operation_id: row.operation_id,
    label: row.label,
    sequence_number: row.sequence_number ?? undefined,
    is_primary: row.is_primary,
    site_kind: row.site_kind ?? "",
    activity_type: row.activity_type ?? undefined,
    building_type: row.building_type ?? undefined,
    dedicated_building: row.dedicated_building ?? undefined,
    climate_zone: row.climate_zone ?? undefined,
    operating_mode: row.operating_mode ?? undefined,
    height_m: row.height_m ?? undefined,
    volume_m3: row.volume_m3 ?? undefined,
    area_m2: row.area_m2 ?? undefined,
    flow_type: row.flow_type ?? undefined,
    heating_system_type: row.heating_system_type ?? undefined,
    convective_power_kw: row.convective_power_kw ?? undefined,
    radiant_power_kw: row.radiant_power_kw ?? undefined,
    calculated_power_kw: row.calculated_power_kw ?? undefined,
    air_flow_required_m3h: row.air_flow_required_m3h ?? undefined,
    destratifier_quantity_required: row.destratifier_quantity_required ?? undefined,
    notes: row.notes ?? undefined,
  };
}
