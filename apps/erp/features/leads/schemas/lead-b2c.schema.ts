import { z } from "zod";

export const HEATING_MODE_B2C_VALUES = [
  "gaz",
  "gaz_cond",
  "fioul",
  "elec",
  "bois",
  "granules",
  "pac_air_eau",
  "pac_air_air",
] as const;

const heatingModeB2CEnum = z.enum(HEATING_MODE_B2C_VALUES);

const jsonRecord = z.record(z.string(), z.unknown()).default({});

const leadB2CFields = {
  lead_id: z.string().uuid(),
  archived_at: z.string().datetime({ offset: true }).nullable().optional(),
  property_type: z.enum(["maison", "appartement", "immeuble"]).nullable().optional(),
  periode_construction: z.enum(["avant_2000", "apres_2000"]).nullable().optional(),
  dpe_class: z.enum(["A", "B", "C", "D", "E", "F", "G", "inconnu"]).nullable().optional(),
  age_logement: z.enum(["moins_15_ans", "plus_15_ans"]).nullable().optional(),
  nb_personnes: z.number().int().min(1).max(20).nullable().optional(),
  tranche_revenu: z
    .enum(["tres_modeste", "modeste", "intermediaire", "superieur"])
    .nullable()
    .optional(),
  profil_occupant: z
    .enum(["proprietaire_occupant", "bailleur", "sci", "locataire"])
    .nullable()
    .optional(),
  raison_sociale_sci: z.string().max(500).nullable().optional(),
  patrimoine_type: z.enum(["appartements", "maisons", "mixte"]).nullable().optional(),
  nb_logements: z.number().int().min(0).nullable().optional(),
  surface_totale_m2: z.number().positive().nullable().optional(),
  ite_iti_recente: z.boolean().nullable().optional(),
  fenetres: z.string().max(2000).nullable().optional(),
  sous_sol: z.boolean().nullable().optional(),
  btd_installe: z.boolean().nullable().optional(),
  vmc_installee: z.boolean().nullable().optional(),
  chauffage_24_mois: z.boolean().nullable().optional(),
  travaux_cee_recus: z.string().max(2000).nullable().optional(),
  heating_mode_b2c: z.array(heatingModeB2CEnum).default([]),
  sim_residentiel_payload: jsonRecord,
  sim_residentiel_result: jsonRecord,
};

export const LeadB2CInsertSchema = z.object(leadB2CFields);

export const LeadB2CUpdateSchema = z
  .object({
    id: z.string().uuid(),
  })
  .merge(z.object(leadB2CFields).partial());

export const LeadB2CPatchSchema = z.object(leadB2CFields).partial();

export type LeadB2CInsert = z.infer<typeof LeadB2CInsertSchema>;
export type LeadB2CUpdate = z.infer<typeof LeadB2CUpdateSchema>;
export type LeadB2CPatch = z.infer<typeof LeadB2CPatchSchema>;
