import type { LeadRow } from "@/features/leads/types";
import { normalizeHeatingModesFromDb } from "@/features/leads/lib/heating-modes";
import { isoToDateInput, isoToDatetimeLocal } from "@/features/technical-visits/lib/datetime";
import { normalizePhotosFromDb, EMPTY_TECHNICAL_VISIT_PHOTOS } from "@/features/technical-visits/lib/photos";
import type { TechnicalVisitInsertInput } from "@/features/technical-visits/schemas/technical-visit.schema";
import type { TechnicalVisitRow } from "@/features/technical-visits/types";
import { regionFromWorksiteOrHeadOfficePostalCode } from "@/lib/fr-postal-region";

function trimU(s: string | null | undefined): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}

export const EMPTY_TECHNICAL_VISIT_FORM: TechnicalVisitInsertInput = {
  vt_reference: "",
  lead_id: "",
  status: "to_schedule",
  scheduled_at: undefined,
  performed_at: undefined,
  time_slot: undefined,
  technician_id: undefined,
  worksite_address: undefined,
  worksite_postal_code: undefined,
  worksite_city: undefined,
  region: undefined,
  surface_m2: undefined,
  ceiling_height_m: undefined,
  heating_type: [],
  observations: undefined,
  technical_report: undefined,
  photos: { ...EMPTY_TECHNICAL_VISIT_PHOTOS },
};

/**
 * Valeurs formulaire VT. Si `leadForWorksite` est fourni, on complète adresse / CP / ville
 * depuis le lead quand la VT n’a pas CP ou ville (données souvent restées sur une seule ligne).
 */
export function technicalVisitRowToFormValues(
  row: TechnicalVisitRow,
  leadForWorksite?: Pick<LeadRow, "worksite_address" | "worksite_postal_code" | "worksite_city"> | null,
): TechnicalVisitInsertInput {
  const vtAddr = trimU(row.worksite_address);
  const vtCp = trimU(row.worksite_postal_code);
  const vtCity = trimU(row.worksite_city);

  let worksite_address = vtAddr;
  let worksite_postal_code = vtCp;
  let worksite_city = vtCity;

  const l = leadForWorksite;
  if (l) {
    const lAddr = trimU(l.worksite_address);
    const lCp = trimU(l.worksite_postal_code);
    const lCity = trimU(l.worksite_city);
    const leadHasCpAndCity = Boolean(lCp && lCity);
    const vtMissingCpOrCity = !vtCp || !vtCity;

    if (leadHasCpAndCity && vtMissingCpOrCity) {
      worksite_address = lAddr ?? vtAddr;
      worksite_postal_code = lCp;
      worksite_city = lCity;
    } else {
      worksite_address = vtAddr ?? lAddr;
      worksite_postal_code = vtCp ?? lCp;
      worksite_city = vtCity ?? lCity;
    }
  }

  const regionFromCp = regionFromWorksiteOrHeadOfficePostalCode(worksite_postal_code, undefined);
  const region = regionFromCp ?? trimU(row.region) ?? undefined;

  return {
    vt_reference: row.vt_reference,
    lead_id: row.lead_id,
    status: row.status,
    scheduled_at: isoToDateInput(row.scheduled_at),
    performed_at: isoToDatetimeLocal(row.performed_at),
    time_slot: row.time_slot ?? undefined,
    technician_id: row.technician_id ?? undefined,
    worksite_address,
    worksite_postal_code,
    worksite_city,
    region,
    surface_m2: row.surface_m2 ?? undefined,
    ceiling_height_m: row.ceiling_height_m ?? undefined,
    heating_type: normalizeHeatingModesFromDb(row.heating_type),
    observations: row.observations ?? undefined,
    technical_report: row.technical_report ?? undefined,
    photos: normalizePhotosFromDb(row.photos),
  };
}
