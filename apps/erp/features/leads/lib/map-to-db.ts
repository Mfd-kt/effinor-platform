import type { Database } from "@/types/database.types";

import { heatingModesToDb } from "@/features/leads/lib/heating-modes";
import { datetimeLocalToIso } from "@/features/technical-visits/lib/datetime";
import type { LeadInsertInput, LeadUpdatePayload } from "@/features/leads/schemas/lead.schema";

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

function trimOrEmpty(s: string | undefined | null): string {
  return (s ?? "").trim();
}

function trimOrNull(s: string | undefined | null): string | null {
  const t = (s ?? "").trim();
  return t === "" ? null : t;
}

function mapCommon(data: LeadInsertInput): Omit<
  LeadInsert,
  "id" | "qualification_status" | "created_by_agent_id"
> {
  const headOfficeSiret = trimOrNull(data.head_office_siret) ?? trimOrNull(data.siret);
  const firstName = trimOrNull(data.first_name);
  const lastName = trimOrNull(data.last_name);
  const nameParts = [firstName, lastName].filter((x): x is string => Boolean(x?.length));
  const contactNameFromParts = nameParts.length ? nameParts.join(" ") : null;
  return {
    source: data.source,
    campaign: trimOrNull(data.campaign),
    landing: trimOrNull(data.landing),
    product_interest: null,
    company_name: data.company_name.trim(),
    siret: headOfficeSiret,
    head_office_siret: headOfficeSiret,
    worksite_siret: trimOrNull(data.worksite_siret),
    first_name: firstName,
    last_name: lastName,
    civility: trimOrNull(data.civility),
    contact_name: contactNameFromParts,
    email: trimOrNull(data.email),
    phone: trimOrNull(data.phone),
    contact_role: trimOrNull(data.contact_role),
    head_office_address: trimOrEmpty(data.head_office_address),
    head_office_postal_code: trimOrEmpty(data.head_office_postal_code),
    head_office_city: trimOrEmpty(data.head_office_city),
    worksite_address: trimOrEmpty(data.worksite_address),
    worksite_postal_code: trimOrEmpty(data.worksite_postal_code),
    worksite_city: trimOrEmpty(data.worksite_city),
    building_type: trimOrNull(data.building_type),
    surface_m2: data.surface_m2 ?? null,
    ceiling_height_m: data.ceiling_height_m ?? null,
    heated_building: data.heated_building ?? null,
    heating_type: heatingModesToDb(data.heating_type),
    warehouse_count: data.warehouse_count ?? null,
    lead_status: data.lead_status,
    callback_at: datetimeLocalToIso(data.callback_at),
    confirmed_by_user_id: data.confirmed_by_user_id ?? null,
    aerial_photos: data.aerial_photos?.length ? data.aerial_photos : [],
    cadastral_parcel_files: data.cadastral_parcel_files?.length ? data.cadastral_parcel_files : [],
    recording_files: data.recording_files?.length ? data.recording_files : [],
    study_media_files: data.study_media_files?.length ? data.study_media_files : [],
    recording_notes: trimOrNull(data.recording_notes),
    ai_lead_summary: trimOrNull(data.ai_lead_summary),
    ai_lead_score:
      data.ai_lead_score === undefined || data.ai_lead_score === null ? null : data.ai_lead_score,
  };
}

export function insertFromLeadForm(data: LeadInsertInput): LeadInsert {
  const { created_by_agent_id: _creator, ...rest } = data;
  void _creator;
  return {
    ...mapCommon(rest as LeadInsertInput),
    qualification_status: "pending",
  };
}

export function updateFromLeadForm(data: Omit<LeadUpdatePayload, "id">): LeadUpdate {
  const { created_by_agent_id, ...dataForCommon } = data;
  const m = mapCommon(dataForCommon as LeadInsertInput);
  const { confirmed_by_user_id, ...patch } = m;
  void confirmed_by_user_id;
  const out: LeadUpdate = { ...patch };
  if (created_by_agent_id !== undefined) {
    out.created_by_agent_id = created_by_agent_id;
  }
  return out;
}
