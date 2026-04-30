import { z } from "zod";

import { LEAD_SOURCE_VALUES, LEAD_STATUS_VALUES } from "./lead.schema";

/** Aligné sur `public.qualification_status`. */
export const QUALIFICATION_STATUS_VALUES = [
  "pending",
  "in_progress",
  "qualified",
  "disqualified",
] as const;

const leadTypeEnum = z.enum(["unknown", "b2c", "b2b"]);

const optionalUuidNullable = z.string().uuid().nullable().optional();

const optionalDateTimeInput = z
  .string()
  .optional()
  .transform((s) => {
    if (s === undefined || s.trim() === "") return undefined;
    return s.trim();
  });

const mediaUrlList = z.preprocess(
  (val) => (Array.isArray(val) ? val : []),
  z.array(z.string().min(1).max(2000)).max(40),
);

const emailField = z
  .string()
  .nullable()
  .optional()
  .refine(
    (val) =>
      val === undefined ||
      val === null ||
      val.trim() === "" ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
    { message: "Email invalide." },
  );

const leadCommonFields = {
  lead_type: leadTypeEnum.default("unknown"),
  display_name: z.string().trim().min(1).max(500).optional(),
  source: z.enum(LEAD_SOURCE_VALUES),
  campaign: z.string().max(200).nullable().optional(),
  landing: z.string().max(200).nullable().optional(),
  lead_channel: z.string().max(200).nullable().optional(),
  lead_origin: z.string().max(200).nullable().optional(),
  lead_generation_stock_id: optionalUuidNullable,
  lead_generation_assignment_id: optionalUuidNullable,
  cee_sheet_id: optionalUuidNullable,
  current_workflow_id: optionalUuidNullable,
  created_by_agent_id: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((s) => {
      if (s === undefined) return undefined;
      if (s === "" || s === null) return null;
      return s;
    }),
  assigned_to: optionalUuidNullable,
  owner_user_id: optionalUuidNullable,
  confirmed_by_user_id: optionalUuidNullable,
  simulated_by_user_id: optionalUuidNullable,
  simulated_at: z.string().datetime({ offset: true }).nullable().optional(),
  sim_version: z.string().max(120).nullable().optional(),
  lead_status: z.enum(LEAD_STATUS_VALUES),
  qualification_status: z.enum(QUALIFICATION_STATUS_VALUES),
  callback_at: optionalDateTimeInput,
  next_callback_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  next_callback_time: z.string().max(32).nullable().optional(),
  last_call_status: z.string().max(120).nullable().optional(),
  last_call_note: z.string().max(8000).nullable().optional(),
  last_call_recording_url: z.string().max(2000).nullable().optional(),
  last_call_at: z.string().max(40).nullable().optional(),
  civility: z.string().max(20).nullable().optional(),
  first_name: z.string().max(120).nullable().optional(),
  last_name: z.string().max(120).nullable().optional(),
  contact_name: z.string().max(250).nullable().optional(),
  email: emailField,
  phone: z.string().max(50).nullable().optional(),
  worksite_address: z.string().max(2000),
  worksite_postal_code: z.string().max(20),
  worksite_city: z.string().max(120),
  latitude: z.number().finite().nullable().optional(),
  longitude: z.number().finite().nullable().optional(),
  surface_m2: z.number().positive().nullable().optional(),
  ceiling_height_m: z.number().positive().nullable().optional(),
  heating_type: z.array(z.string()).nullable().optional(),
  aerial_photos: mediaUrlList,
  cadastral_parcel_files: mediaUrlList,
  recording_files: mediaUrlList,
  recording_notes: z.string().max(100_000).nullable().optional(),
  study_media_files: mediaUrlList,
  ai_lead_summary: z.string().max(8000).nullable().optional(),
  ai_lead_score: z
    .preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
      const s = String(val).trim().replace(/\s/g, "").replace(",", ".");
      if (s === "") return undefined;
      const n = Number(s);
      if (!Number.isFinite(n)) return undefined;
      return Math.min(100, Math.max(0, Math.round(n)));
    }, z.number().int().min(0).max(100).nullable().optional()),
  pac_eligible: z.boolean().nullable().optional(),
  renov_eligible: z.boolean().nullable().optional(),
  sim_payload_json: z.unknown().nullable().optional(),
};

export const LeadCommonInsertSchema = z.object(leadCommonFields);

export const LeadCommonUpdateSchema = z
  .object({
    id: z.string().uuid(),
  })
  .merge(z.object(leadCommonFields).partial());

export type LeadCommonInsert = z.infer<typeof LeadCommonInsertSchema>;
export type LeadCommonUpdate = z.infer<typeof LeadCommonUpdateSchema>;
