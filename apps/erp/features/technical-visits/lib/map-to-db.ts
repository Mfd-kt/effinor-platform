import type { Database } from "@/types/database.types";

import { heatingModesToDb } from "@/features/leads/lib/heating-modes";
import { dateInputToIso, datetimeLocalToIso } from "@/features/technical-visits/lib/datetime";
import { photosGroupedToJson } from "@/features/technical-visits/lib/photos";
import type {
  TechnicalVisitInsertInput,
  TechnicalVisitUpdateInput,
} from "@/features/technical-visits/schemas/technical-visit.schema";

type TechnicalVisitInsert = Database["public"]["Tables"]["technical_visits"]["Insert"];
type TechnicalVisitUpdate = Database["public"]["Tables"]["technical_visits"]["Update"];

function trimOrNull(v: string | undefined): string | null {
  if (v === undefined) return null;
  const t = v.trim();
  return t === "" ? null : t;
}


export function insertFromTechnicalVisitForm(data: TechnicalVisitInsertInput): TechnicalVisitInsert {
  const row: TechnicalVisitInsert = {
    lead_id: data.lead_id,
    status: data.status,
    scheduled_at: dateInputToIso(data.scheduled_at),
    performed_at: datetimeLocalToIso(data.performed_at),
    time_slot: trimOrNull(data.time_slot),
    technician_id: data.technician_id ?? null,
    worksite_address: trimOrNull(data.worksite_address),
    worksite_postal_code: trimOrNull(data.worksite_postal_code),
    worksite_city: trimOrNull(data.worksite_city),
    region: trimOrNull(data.region),
    surface_m2: data.surface_m2 ?? null,
    ceiling_height_m: data.ceiling_height_m ?? null,
    heating_type: heatingModesToDb(data.heating_type),
    observations: trimOrNull(data.observations),
    technical_report: trimOrNull(data.technical_report),
    photos: photosGroupedToJson(data.photos),
  };

  const ref = data.vt_reference?.trim();
  if (ref) {
    row.vt_reference = ref;
  }

  return row;
}

export function updateFromTechnicalVisitForm(
  data: Omit<TechnicalVisitUpdateInput, "id">,
): TechnicalVisitUpdate {
  const patch: TechnicalVisitUpdate = {};

  if (data.vt_reference !== undefined) {
    patch.vt_reference = data.vt_reference.trim();
  }
  if (data.lead_id !== undefined) patch.lead_id = data.lead_id;
  if (data.status !== undefined) patch.status = data.status;
  if (data.scheduled_at !== undefined) {
    patch.scheduled_at = dateInputToIso(data.scheduled_at);
  }
  if (data.performed_at !== undefined) {
    patch.performed_at = datetimeLocalToIso(data.performed_at);
  }
  if (data.time_slot !== undefined) patch.time_slot = trimOrNull(data.time_slot);
  if (data.technician_id !== undefined) patch.technician_id = data.technician_id ?? null;
  if (data.worksite_address !== undefined) patch.worksite_address = trimOrNull(data.worksite_address);
  if (data.worksite_postal_code !== undefined) {
    patch.worksite_postal_code = trimOrNull(data.worksite_postal_code);
  }
  if (data.worksite_city !== undefined) patch.worksite_city = trimOrNull(data.worksite_city);
  if (data.region !== undefined) patch.region = trimOrNull(data.region);
  if (data.surface_m2 !== undefined) patch.surface_m2 = data.surface_m2 ?? null;
  if (data.ceiling_height_m !== undefined) patch.ceiling_height_m = data.ceiling_height_m ?? null;
  if (data.heating_type !== undefined) patch.heating_type = heatingModesToDb(data.heating_type);
  if (data.observations !== undefined) patch.observations = trimOrNull(data.observations);
  if (data.technical_report !== undefined) {
    patch.technical_report = trimOrNull(data.technical_report);
  }
  if (data.photos !== undefined) {
    patch.photos = photosGroupedToJson(data.photos);
  }

  return patch;
}
