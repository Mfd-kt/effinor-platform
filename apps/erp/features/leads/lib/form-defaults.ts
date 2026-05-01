import { coerceBuildingTypeForForm } from "@/features/leads/lib/building-types";
import type { LeadB2BActiveRow, LeadB2CActiveRow } from "@/features/leads/lib/lead-extensions-access";
import { stringArrayFromLeadJson } from "@/features/leads/lib/lead-media-json";
import { normalizeHeatingModesFromDb, type HeatingMode } from "@/features/leads/lib/heating-modes";
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
import type { LeadDetailRow, LeadDetailWithExtensions, LeadRow } from "@/features/leads/types";

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
  lead_type: "unknown",
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

/** Modes résidentiels B2C → codes formulaire (`HEATING_MODE_VALUES`). */
function heatingModesFromB2c(modes: readonly string[] | null | undefined): HeatingMode[] {
  if (!modes?.length) return [];
  const map: Record<string, HeatingMode> = {
    gaz: "chaudiere_eau",
    gaz_cond: "chaudiere_eau",
    fioul: "chaudiere_eau",
    elec: "electrique_direct",
    bois: "autre_inconnu",
    granules: "autre_inconnu",
    pac_air_eau: "pac_air_eau",
    pac_air_air: "pac_air_air",
  };
  const out: HeatingMode[] = [];
  for (const m of modes) {
    const v = map[m];
    if (v) out.push(v);
  }
  return [...new Set(out)];
}

function mergeB2bExtensionIntoForm(base: LeadFormInput, b: LeadB2BActiveRow): LeadFormInput {
  const b2bHeating = normalizeHeatingModesFromDb(b.heating_mode_b2b);
  return {
    ...base,
    company_name: b.company_name,
    siret: strOrEmpty(b.siret),
    head_office_siret: strOrEmpty(b.head_office_siret) || strOrEmpty(b.siret),
    worksite_siret: strOrEmpty(b.worksite_siret),
    head_office_address: strOrEmpty(b.head_office_address),
    head_office_postal_code: strOrEmpty(b.head_office_postal_code),
    head_office_city: strOrEmpty(b.head_office_city),
    building_type: coerceBuildingTypeForForm(b.building_type) || base.building_type,
    heated_building:
      b.heated_building === null || b.heated_building === undefined
        ? base.heated_building
        : b.heated_building
          ? "true"
          : "false",
    heating_type: b2bHeating.length ? b2bHeating : base.heating_type,
    warehouse_count: b.warehouse_count ?? base.warehouse_count,
    contact_role:
      strOrEmpty(b.contact_role) ||
      strOrEmpty(b.job_title) ||
      strOrEmpty(b.department) ||
      base.contact_role,
    ...b2bExtensionExtraFields(b),
  } as LeadFormInput;
}

/** Champs B2C non présents sur `LeadInsertSchema` : conservés pour Phase 2.4+ (futurs inputs). */
function b2cExtensionExtraFields(c: LeadB2CActiveRow): Record<string, unknown> {
  const out: Record<string, unknown> = {
    property_type: c.property_type,
    periode_construction: c.periode_construction,
    dpe_class: c.dpe_class,
    age_logement: c.age_logement,
    nb_personnes: c.nb_personnes,
    tranche_revenu: c.tranche_revenu,
    profil_occupant: c.profil_occupant,
    raison_sociale_sci: c.raison_sociale_sci,
    patrimoine_type: c.patrimoine_type,
    nb_logements: c.nb_logements,
    ite_iti_recente: c.ite_iti_recente,
    fenetres: c.fenetres,
    sous_sol: c.sous_sol,
    btd_installe: c.btd_installe,
    vmc_installee: c.vmc_installee,
    chauffage_24_mois: c.chauffage_24_mois,
    travaux_cee_recus: c.travaux_cee_recus,
    sim_residentiel_payload: c.sim_residentiel_payload,
    sim_residentiel_result: c.sim_residentiel_result,
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}

/** Champs simulateur / métadonnées B2B hors formulaire plat. */
function b2bExtensionExtraFields(b: LeadB2BActiveRow): Record<string, unknown> {
  const out: Record<string, unknown> = {
    sim_destratification_payload: b.sim_destratification_payload,
    sim_height_m: b.sim_height_m,
    sim_surface_m2: b.sim_surface_m2,
    sim_client_type: b.sim_client_type,
    sim_model: b.sim_model,
    sim_heating_mode: b.sim_heating_mode,
    sim_consigne: b.sim_consigne,
    sim_volume_m3: b.sim_volume_m3,
    sim_air_change_rate: b.sim_air_change_rate,
    sim_model_capacity_m3h: b.sim_model_capacity_m3h,
    sim_needed_destrat: b.sim_needed_destrat,
    sim_power_kw: b.sim_power_kw,
    sim_consumption_kwh_year: b.sim_consumption_kwh_year,
    sim_cost_year_min: b.sim_cost_year_min,
    sim_cost_year_max: b.sim_cost_year_max,
    sim_cost_year_selected: b.sim_cost_year_selected,
    sim_saving_kwh_30: b.sim_saving_kwh_30,
    sim_saving_eur_30_min: b.sim_saving_eur_30_min,
    sim_saving_eur_30_max: b.sim_saving_eur_30_max,
    sim_saving_eur_30_selected: b.sim_saving_eur_30_selected,
    sim_co2_saved_tons: b.sim_co2_saved_tons,
    sim_cee_prime_estimated: b.sim_cee_prime_estimated,
    sim_install_unit_price: b.sim_install_unit_price,
    sim_install_total_price: b.sim_install_total_price,
    sim_rest_to_charge: b.sim_rest_to_charge,
    sim_lead_score: b.sim_lead_score,
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}

function mergeB2cExtensionIntoForm(base: LeadFormInput, c: LeadB2CActiveRow): LeadFormInput {
  const b2cHeating = heatingModesFromB2c(c.heating_mode_b2c);
  const surfacePatch =
    c.surface_totale_m2 != null && c.surface_totale_m2 !== undefined
      ? { surface_m2: Number(c.surface_totale_m2) }
      : {};

  return {
    ...base,
    ...surfacePatch,
    heating_type: b2cHeating.length ? b2cHeating : base.heating_type,
    ...b2cExtensionExtraFields(c),
  } as LeadFormInput;
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

export function leadRowToFormValues(
  row: LeadRow | LeadDetailRow | LeadDetailWithExtensions,
): LeadFormInput {
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

  let result: LeadFormInput = {
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
    lead_type:
      row.lead_type === "b2b" || row.lead_type === "b2c" || row.lead_type === "unknown"
        ? row.lead_type
        : "unknown",
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

  if ("b2b" in row && row.b2b) {
    result = mergeB2bExtensionIntoForm(result, row.b2b);
  }

  if ("b2c" in row && row.b2c) {
    result = mergeB2cExtensionIntoForm(result, row.b2c);
  }

  return result;
}
