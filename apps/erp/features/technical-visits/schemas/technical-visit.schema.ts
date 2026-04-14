import { z } from "zod";

import { HEATING_MODE_VALUES } from "@/features/leads/lib/heating-modes";
import type { TechnicalVisitPhotosGrouped } from "@/features/technical-visits/lib/photos";
import type { TechnicalVisitStatus } from "@/types/database.types";

export const TECHNICAL_VISIT_STATUS_VALUES = [
  "to_schedule",
  "scheduled",
  "performed",
  "report_pending",
  "validated",
  "refused",
  "cancelled",
] as const satisfies readonly TechnicalVisitStatus[];

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

const technicalVisitPhotosGroupedSchema = z.object({
  visit_photos: z.array(z.string()).default([]),
  report_pdfs: z.array(z.string()).default([]),
  sketches: z.array(z.string()).default([]),
});

const photosFieldSchema = z.preprocess((val: unknown): TechnicalVisitPhotosGrouped => {
  if (val == null || val === undefined) {
    return { visit_photos: [], report_pdfs: [], sketches: [] };
  }
  if (Array.isArray(val)) {
    return {
      visit_photos: val.filter((x): x is string => typeof x === "string" && x.trim().length > 0),
      report_pdfs: [],
      sketches: [],
    };
  }
  if (typeof val === "object" && val !== null) {
    const o = val as Record<string, unknown>;
    const pick = (k: string) =>
      Array.isArray(o[k])
        ? (o[k] as unknown[]).filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        : [];
    return {
      visit_photos: pick("visit_photos"),
      report_pdfs: pick("report_pdfs"),
      sketches: pick("sketches"),
    };
  }
  return { visit_photos: [], report_pdfs: [], sketches: [] };
}, technicalVisitPhotosGroupedSchema);

const baseTechnicalVisitFields = {
  vt_reference: z.string().max(80).optional(),
  lead_id: z
    .string()
    .min(1, "Sélectionnez un lead.")
    .uuid("Identifiant lead invalide."),
  status: z.enum(TECHNICAL_VISIT_STATUS_VALUES),
  scheduled_at: optionalDateTimeInput,
  performed_at: optionalDateTimeInput,
  time_slot: z.string().max(120).optional(),
  technician_id: optionalUuidOrEmpty,
  worksite_address: z.string().max(2000).optional(),
  worksite_postal_code: z.string().max(20).optional(),
  worksite_city: z.string().max(120).optional(),
  region: z.string().max(120).optional(),
  surface_m2: optionalNumber,
  ceiling_height_m: optionalNumber,
  heating_type: z.array(z.enum(HEATING_MODE_VALUES)).optional(),
  observations: z.string().max(20_000).optional(),
  technical_report: z.string().max(50_000).optional(),
  photos: photosFieldSchema.optional(),
};

export const TechnicalVisitInsertSchema = z.object(baseTechnicalVisitFields);

export const TechnicalVisitUpdateSchema = z
  .object(baseTechnicalVisitFields)
  .partial()
  .extend({
    id: z.string().uuid("Identifiant invalide."),
  });

export type TechnicalVisitInsertInput = z.infer<typeof TechnicalVisitInsertSchema>;
export type TechnicalVisitUpdateInput = z.infer<typeof TechnicalVisitUpdateSchema>;
