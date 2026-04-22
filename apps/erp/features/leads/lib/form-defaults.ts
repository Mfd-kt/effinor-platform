import { coerceBuildingTypeForForm } from "@/features/leads/lib/building-types";
import { stringArrayFromLeadJson } from "@/features/leads/lib/lead-media-json";
import { normalizeHeatingModesFromDb } from "@/features/leads/lib/heating-modes";
import {
  leadBuildingTypeFromSimulatorCee,
  leadHeatingTypesFromSimulator,
  leadHeatingTypesFromSimulationPayloads,
  parseWorkflowSimulationSnapshotJson,
} from "@/features/leads/lib/simulator-to-lead-technical";
// TODO: cee-workflows / simulator retiré — la logique « PAC préférée » dépendait du simulateur ; neutralisée.
function isPacPreferredLocalUsage(_localUsage: any): boolean {
  return false;
}
import { isoToDatetimeLocal } from "@/features/technical-visits/lib/datetime";
import type { LeadFormInput, LeadInsertInput } from "@/features/leads/schemas/lead.schema";
import type { LeadDetailRow, LeadRow } from "@/features/leads/types";

/** Chaînes `""` plutôt que `undefined` pour les champs `<Input />` (évite controlled/uncontrolled). */
export const EMPTY_LEAD_FORM: LeadFormInput = {
  source: "cold_call",
  campaign: "",
  landing: "",
  company_name: "",
  siret: "",
  head_office_siret: "",
  worksite_siret: "",
  first_name: "",
  last_name: "",
  civility: "",
  email: "",
  phone: "",
  contact_role: "",
  head_office_address: "",
  head_office_postal_code: "",
  head_office_city: "",
  worksite_address: "",
  worksite_postal_code: "",
  worksite_city: "",
  surface_m2: undefined,
  ceiling_height_m: undefined,
  building_type: "",
  heated_building: "",
  heating_type: [],
  warehouse_count: undefined,
  lead_status: "new",
  callback_at: undefined,
  confirmed_by_user_id: undefined,
  aerial_photos: [],
  cadastral_parcel_files: [],
  recording_files: [],
  study_media_files: [],
  recording_notes: "",
  ai_lead_summary: "",
  ai_lead_score: undefined,
  created_by_agent_id: "",
};

function strOrEmpty(v: string | null | undefined): string {
  return v ?? "";
}

function splitContactName(fullName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const cleaned = (fullName ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return { firstName: "", lastName: "" };
  const parts = cleaned.split(" ");
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" };
  return {
    firstName: parts.shift() ?? "",
    lastName: parts.join(" ").trim(),
  };
}

export function heatingTypeFromSimulator(raw: string | null | undefined) {
  switch ((raw ?? "").trim().toLowerCase()) {
    case "gaz":
    case "fioul":
      return ["chaudiere_eau"] as const;
    case "pac":
      return ["pac_air_eau"] as const;
    case "elec":
      return ["electrique_direct"] as const;
    case "bois":
      return ["autre_inconnu"] as const;
    default:
      return [] as const;
  }
}

export function buildingTypeFromSimulatorClientType(raw: string | null | undefined): string {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  if (v.includes("industriel") || v.includes("logistique")) return "INDUSTRIE";
  if (v.includes("collectivit")) return "TERTIAIRE";
  if (v.includes("tertiaire")) return "TERTIAIRE";
  return "";
}

/** Repasse les sorties Zod (ex. `created_by_agent_id: null`) vers les valeurs contrôlées du formulaire. */
export function leadInsertToFormInput(data: LeadInsertInput): LeadFormInput {
  return {
    ...data,
    created_by_agent_id: data.created_by_agent_id ?? "",
  } as LeadFormInput;
}

export function leadRowToFormValues(row: LeadRow | LeadDetailRow): LeadFormInput {
  const fallbackContact = splitContactName(row.contact_name);
  const fallbackFirstName = strOrEmpty(row.first_name) || fallbackContact.firstName;
  const fallbackLastName = strOrEmpty(row.last_name) || fallbackContact.lastName;
  const fallbackContactRole =
    strOrEmpty(row.contact_role) || strOrEmpty(row.job_title) || strOrEmpty(row.department);
  const fallbackHeadOfficeSiret = strOrEmpty(row.head_office_siret) || strOrEmpty(row.siret);
  const fallbackWorksiteSiret = strOrEmpty(row.worksite_siret);
  const fallbackWorksitePostalCode =
    strOrEmpty(row.worksite_postal_code) || strOrEmpty(row.head_office_postal_code);
  const simPayloadParsed = row.sim_payload_json
    ? parseWorkflowSimulationSnapshotJson(row.sim_payload_json)
    : null;
  const fallbackSurface =
    row.surface_m2 ?? row.sim_surface_m2 ?? simPayloadParsed?.surfaceM2 ?? undefined;
  const skipSimHeight =
    simPayloadParsed != null && isPacPreferredLocalUsage(simPayloadParsed.localUsage);
  const fallbackHeight = skipSimHeight
    ? row.ceiling_height_m ?? undefined
    : row.ceiling_height_m ?? row.sim_height_m ?? simPayloadParsed?.heightM ?? undefined;
  const buildingFromPayload =
    simPayloadParsed != null
      ? leadBuildingTypeFromSimulatorCee(simPayloadParsed.buildingType, simPayloadParsed.localUsage)
      : undefined;
  const fallbackBuildingType =
    coerceBuildingTypeForForm(row.building_type) ||
    buildingTypeFromSimulatorClientType(row.sim_client_type) ||
    (buildingFromPayload ?? "");
  const fallbackHeatingType = normalizeHeatingModesFromDb(row.heating_type);
  const simHeatingFallback = heatingTypeFromSimulator(row.sim_heating_mode);
  const heatingFromPayload =
    simPayloadParsed != null
      ? leadHeatingTypesFromSimulator(
          simPayloadParsed.currentHeatingMode,
          simPayloadParsed.computedHeatingMode,
        )
      : leadHeatingTypesFromSimulationPayloads(row.sim_payload_json, row.sim_payload_json);
  const resolvedHeatingType = fallbackHeatingType.length
    ? fallbackHeatingType
    : heatingFromPayload.length
      ? heatingFromPayload
      : [...simHeatingFallback];

  return {
    source: row.source,
    campaign: strOrEmpty(row.campaign),
    landing: strOrEmpty(row.landing),
    company_name: row.company_name,
    siret: fallbackHeadOfficeSiret,
    head_office_siret: fallbackHeadOfficeSiret,
    worksite_siret: fallbackWorksiteSiret,
    first_name: fallbackFirstName,
    last_name: fallbackLastName,
    civility: strOrEmpty(row.civility),
    email: strOrEmpty(row.email),
    phone: strOrEmpty(row.phone),
    contact_role: fallbackContactRole,
    head_office_address: strOrEmpty(row.head_office_address),
    head_office_postal_code: strOrEmpty(row.head_office_postal_code),
    head_office_city: strOrEmpty(row.head_office_city),
    worksite_address: strOrEmpty(row.worksite_address),
    worksite_postal_code: fallbackWorksitePostalCode,
    worksite_city: strOrEmpty(row.worksite_city),
    surface_m2: fallbackSurface,
    ceiling_height_m: fallbackHeight,
    building_type: fallbackBuildingType,
    heated_building:
      row.heated_building === null || row.heated_building === undefined
        ? ""
        : row.heated_building
          ? "true"
          : "false",
    heating_type: resolvedHeatingType,
    warehouse_count: row.warehouse_count ?? undefined,
    lead_status: row.lead_status,
    callback_at: isoToDatetimeLocal(row.callback_at),
    confirmed_by_user_id: row.confirmed_by_user_id ?? undefined,
    aerial_photos: stringArrayFromLeadJson(row.aerial_photos),
    cadastral_parcel_files: stringArrayFromLeadJson(row.cadastral_parcel_files),
    recording_files: stringArrayFromLeadJson(row.recording_files),
    study_media_files: stringArrayFromLeadJson(row.study_media_files),
    recording_notes: strOrEmpty(row.recording_notes),
    ai_lead_summary: strOrEmpty(row.ai_lead_summary),
    ai_lead_score: row.ai_lead_score ?? undefined,
    created_by_agent_id: row.created_by_agent_id ?? "",
  };
}
