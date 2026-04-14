import { z } from "zod";

import { BUILDING_TYPE_VALUES } from "@/features/leads/lib/building-types";
import { HEATING_MODE_VALUES } from "@/features/leads/lib/heating-modes";
import type { LeadSource, LeadStatus } from "@/types/database.types";

/** Sources alignées sur `public.lead_source` (migration SQL). */
export const LEAD_SOURCE_VALUES = [
  "website",
  "cold_call",
  "commercial_callback",
  "landing_froid",
  "landing_lum",
  "landing_destrat",
  "lead_generation",
  "hpf",
  "kompas",
  "site_internet",
  "prospecting_kompas",
  "phone",
  "partner",
  "referral",
  "other",
] as const satisfies readonly LeadSource[];

/** Statuts alignés sur `public.lead_status` (migration SQL). */
export const LEAD_STATUS_VALUES = [
  "new",
  "contacted",
  "qualified",
  "dossier_sent",
  "accord_received",
  "nurturing",
  "lost",
  "converted",
] as const satisfies readonly LeadStatus[];

const optionalUuidOrEmpty = z
  .string()
  .optional()
  .transform((s) => {
    if (s === undefined || s.trim() === "") return undefined;
    return s.trim();
  })
  .pipe(z.union([z.string().uuid(), z.undefined()]));

const optionalDateTimeInput = z
  .string()
  .optional()
  .transform((s) => {
    if (s === undefined || s.trim() === "") return undefined;
    return s.trim();
  });

const optionalNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
  const s = String(val).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

/** Liste d’URLs (storage public ou liens). */
const mediaUrlList = z.preprocess(
  (val) => (Array.isArray(val) ? val : []),
  z.array(z.string().min(1).max(2000)).max(40),
);

/** Select HTML : "" | "true" | "false" (ou booléen) → booléen | null en base. */
/** Préprocess : création sans champ monté peut envoyer null / undefined ; la union seule échouait. */
const heatedBuildingField = z.preprocess(
  (val: unknown) => {
    if (val === null || val === undefined) {
      return "";
    }
    return val;
  },
  z.union([z.literal(""), z.literal("true"), z.literal("false"), z.boolean()]),
).transform((v) => {
  if (v === undefined || v === "" || v === null) {
    return null;
  }
  if (v === true || v === "true") {
    return true;
  }
  if (v === false || v === "false") {
    return false;
  }
  return null;
});

const buildingTypeEnum = z.enum(
  BUILDING_TYPE_VALUES as unknown as [string, ...string[]],
);

const buildingTypeField = z.preprocess(
  (val: unknown) => {
    if (val === null || val === undefined) return "";
    return String(val).trim();
  },
  z.union([z.literal(""), buildingTypeEnum]),
).transform((v) => (v === "" ? undefined : v));

/** Champs formulaire (création + édition). L’agent créateur et l’IA restent gérés côté serveur / affichage. */
export const LeadInsertSchema = z.object({
  source: z.enum(LEAD_SOURCE_VALUES),
  campaign: z.string().max(200).optional(),
  landing: z.string().max(200).optional(),
  product_interest: z.string().max(200).optional(),
  company_name: z.string().min(1, "La société est obligatoire.").max(500),
  siret: z.string().max(20).optional(),
  head_office_siret: z.string().max(20).optional(),
  worksite_siret: z.string().max(20).optional(),
  first_name: z.string().max(120).optional(),
  last_name: z.string().max(120).optional(),
  email: z
    .string()
    .optional()
    .refine(
      (val) =>
        val === undefined ||
        val.trim() === "" ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
      { message: "Email invalide." },
    ),
  phone: z.string().max(50).optional(),
  contact_role: z.string().max(120).optional(),
  head_office_address: z.string().max(2000).optional(),
  head_office_postal_code: z.string().max(20).optional(),
  head_office_city: z.string().max(120).optional(),
  worksite_address: z.string().max(2000).optional(),
  worksite_postal_code: z.string().max(20).optional(),
  worksite_city: z.string().max(120).optional(),
  surface_m2: optionalNumber,
  ceiling_height_m: optionalNumber,
  building_type: buildingTypeField,
  heated_building: heatedBuildingField,
  heating_type: z.array(z.enum(HEATING_MODE_VALUES)).optional(),
  warehouse_count: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    if (typeof val === "number") return Number.isInteger(val) ? val : undefined;
    const n = parseInt(String(val).trim(), 10);
    return Number.isFinite(n) ? n : undefined;
  }, z.number().int().min(0).optional()),
  lead_status: z.enum(LEAD_STATUS_VALUES),
  callback_at: optionalDateTimeInput,
  confirmed_by_user_id: optionalUuidOrEmpty,
  aerial_photos: mediaUrlList,
  cadastral_parcel_files: mediaUrlList,
  recording_files: mediaUrlList,
  study_media_files: mediaUrlList,
  recording_notes: z.string().max(100_000).optional(),
  /** Rempli par l’analyse IA (import JSON ou action « note depuis l’audio »). */
  ai_lead_summary: z.string().max(8000).optional(),
  ai_lead_score: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
    const s = String(val).trim().replace(/\s/g, "").replace(",", ".");
    if (s === "") return undefined;
    const n = Number(s);
    if (!Number.isFinite(n)) return undefined;
    return Math.min(100, Math.max(0, Math.round(n)));
  }, z.number().int().min(0).max(100).optional()),
  /** Réassignation du créateur (super_admin uniquement côté serveur). */
  /** Inclut `null` : le resolver client transforme "" → null ; le server action re-valide le même payload. */
  created_by_agent_id: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((s) => {
      if (s === undefined) return undefined;
      if (s === "" || s === null) return null;
      return s;
    }),
});

export const LeadUpdatePayloadSchema = z.intersection(
  z.object({
    id: z.string().uuid("Identifiant invalide."),
  }),
  LeadInsertSchema,
);

export type LeadInsertInput = z.infer<typeof LeadInsertSchema>;
export type LeadUpdatePayload = z.infer<typeof LeadUpdatePayloadSchema>;
export type LeadFormInput = z.input<typeof LeadInsertSchema>;
