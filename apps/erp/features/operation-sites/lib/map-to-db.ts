import type { Database } from "@/types/database.types";

import type { OperationSiteInsertInput } from "@/features/operation-sites/schemas/operation-site.schema";

type OperationSiteInsert = Database["public"]["Tables"]["operation_sites"]["Insert"];
type OperationSiteUpdate = Database["public"]["Tables"]["operation_sites"]["Update"];

function trimOrNull(v: string | undefined): string | null {
  if (v === undefined) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function insertFromOperationSiteForm(data: OperationSiteInsertInput): OperationSiteInsert {
  return {
    operation_id: data.operation_id,
    label: data.label.trim(),
    sequence_number: data.sequence_number ?? null,
    is_primary: data.is_primary ?? false,
    site_kind: data.site_kind ?? null,
    activity_type: trimOrNull(data.activity_type),
    building_type: trimOrNull(data.building_type),
    dedicated_building: trimOrNull(data.dedicated_building),
    climate_zone: trimOrNull(data.climate_zone),
    operating_mode: trimOrNull(data.operating_mode),
    height_m: data.height_m ?? null,
    volume_m3: data.volume_m3 ?? null,
    area_m2: data.area_m2 ?? null,
    flow_type: trimOrNull(data.flow_type),
    heating_system_type: trimOrNull(data.heating_system_type),
    convective_power_kw: data.convective_power_kw ?? null,
    radiant_power_kw: data.radiant_power_kw ?? null,
    calculated_power_kw: data.calculated_power_kw ?? null,
    air_flow_required_m3h: data.air_flow_required_m3h ?? null,
    destratifier_quantity_required: data.destratifier_quantity_required ?? null,
    notes: trimOrNull(data.notes),
  };
}

export function updateFromOperationSiteForm(data: OperationSiteInsertInput): OperationSiteUpdate {
  const patch: OperationSiteUpdate = {};

  if (data.operation_id !== undefined) patch.operation_id = data.operation_id;
  if (data.label !== undefined) patch.label = data.label.trim();
  if (data.sequence_number !== undefined) patch.sequence_number = data.sequence_number ?? null;
  if (data.is_primary !== undefined) patch.is_primary = data.is_primary;
  if (data.site_kind !== undefined) patch.site_kind = data.site_kind ?? null;
  if (data.activity_type !== undefined) patch.activity_type = trimOrNull(data.activity_type);
  if (data.building_type !== undefined) patch.building_type = trimOrNull(data.building_type);
  if (data.dedicated_building !== undefined) {
    patch.dedicated_building = trimOrNull(data.dedicated_building);
  }
  if (data.climate_zone !== undefined) patch.climate_zone = trimOrNull(data.climate_zone);
  if (data.operating_mode !== undefined) patch.operating_mode = trimOrNull(data.operating_mode);
  if (data.height_m !== undefined) patch.height_m = data.height_m ?? null;
  if (data.volume_m3 !== undefined) patch.volume_m3 = data.volume_m3 ?? null;
  if (data.area_m2 !== undefined) patch.area_m2 = data.area_m2 ?? null;
  if (data.flow_type !== undefined) patch.flow_type = trimOrNull(data.flow_type);
  if (data.heating_system_type !== undefined) {
    patch.heating_system_type = trimOrNull(data.heating_system_type);
  }
  if (data.convective_power_kw !== undefined) {
    patch.convective_power_kw = data.convective_power_kw ?? null;
  }
  if (data.radiant_power_kw !== undefined) patch.radiant_power_kw = data.radiant_power_kw ?? null;
  if (data.calculated_power_kw !== undefined) {
    patch.calculated_power_kw = data.calculated_power_kw ?? null;
  }
  if (data.air_flow_required_m3h !== undefined) {
    patch.air_flow_required_m3h = data.air_flow_required_m3h ?? null;
  }
  if (data.destratifier_quantity_required !== undefined) {
    patch.destratifier_quantity_required = data.destratifier_quantity_required ?? null;
  }
  if (data.notes !== undefined) patch.notes = trimOrNull(data.notes);

  return patch;
}
