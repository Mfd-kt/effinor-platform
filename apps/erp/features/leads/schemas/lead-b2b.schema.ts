import { z } from "zod";

import { BUILDING_TYPE_VALUES } from "@/features/leads/lib/building-types";

const buildingTypeEnum = z.enum(BUILDING_TYPE_VALUES as unknown as [string, ...string[]]);

const optionalSiret14 = z
  .string()
  .regex(/^\d{14}$/)
  .nullable()
  .optional();

export const HEATING_MODE_B2B_VALUES = [
  "chaudiere_eau",
  "rayonnement",
  "mix_air_rayonnement",
  "air_chaud_soufflage",
  "pac_air_eau",
  "pac_air_air",
  "electrique_direct",
  "autre_inconnu",
] as const;

const heatingModeB2BEnum = z.enum(HEATING_MODE_B2B_VALUES);

const jsonRecord = z.record(z.string(), z.unknown()).default({});

const simNumber = z.number().finite().nullable().optional();
const simInt = z.number().int().nullable().optional();

const leadB2BFields = {
  lead_id: z.string().uuid(),
  archived_at: z.string().datetime({ offset: true }).nullable().optional(),
  company_name: z.string().trim().min(1).max(500),
  siret: optionalSiret14,
  head_office_siret: optionalSiret14,
  worksite_siret: optionalSiret14,
  head_office_address: z.string().max(2000).default(""),
  head_office_postal_code: z.string().max(20).default(""),
  head_office_city: z.string().max(120).default(""),
  building_type: buildingTypeEnum.nullable().optional(),
  heated_building: z.boolean().nullable().optional(),
  warehouse_count: z.number().int().min(0).nullable().optional(),
  contact_role: z.string().max(120).nullable().optional(),
  job_title: z.string().max(120).nullable().optional(),
  department: z.string().max(120).nullable().optional(),
  heating_mode_b2b: z.array(heatingModeB2BEnum).default([]),
  sim_destratification_payload: jsonRecord,
  sim_height_m: simNumber,
  sim_surface_m2: simNumber,
  sim_client_type: z.string().max(120).nullable().optional(),
  sim_model: z.string().max(200).nullable().optional(),
  sim_heating_mode: z.string().max(120).nullable().optional(),
  sim_consigne: z.string().max(120).nullable().optional(),
  sim_volume_m3: simNumber,
  sim_air_change_rate: simNumber,
  sim_model_capacity_m3h: simNumber,
  sim_needed_destrat: simInt,
  sim_power_kw: simNumber,
  sim_consumption_kwh_year: simNumber,
  sim_cost_year_min: simNumber,
  sim_cost_year_max: simNumber,
  sim_cost_year_selected: simNumber,
  sim_saving_kwh_30: simNumber,
  sim_saving_eur_30_min: simNumber,
  sim_saving_eur_30_max: simNumber,
  sim_saving_eur_30_selected: simNumber,
  sim_co2_saved_tons: simNumber,
  sim_cee_prime_estimated: simNumber,
  sim_install_unit_price: simNumber,
  sim_install_total_price: simNumber,
  sim_rest_to_charge: simNumber,
  sim_lead_score: simInt,
};

export const LeadB2BInsertSchema = z.object(leadB2BFields);

export const LeadB2BUpdateSchema = z
  .object({
    id: z.string().uuid(),
  })
  .merge(z.object(leadB2BFields).partial());

export const LeadB2BPatchSchema = z.object(leadB2BFields).partial();

export type LeadB2BInsert = z.infer<typeof LeadB2BInsertSchema>;
export type LeadB2BUpdate = z.infer<typeof LeadB2BUpdateSchema>;
export type LeadB2BPatch = z.infer<typeof LeadB2BPatchSchema>;
