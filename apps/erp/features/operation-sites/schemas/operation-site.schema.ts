import { z } from "zod";

import type { SiteKind } from "@/types/database.types";

export const SITE_KIND_VALUES = [
  "warehouse",
  "office",
  "greenhouse",
  "industrial",
  "retail",
  "mixed",
  "other",
] as const satisfies readonly SiteKind[];

const optionalNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
  const s = String(val).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const optionalInt = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number") return Number.isFinite(val) ? Math.trunc(val) : undefined;
  const s = String(val).trim().replace(/\s/g, "");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}, z.number().int().optional());

const optionalSiteKind = z
  .union([z.enum(SITE_KIND_VALUES), z.literal(""), z.undefined()])
  .transform((v) => (v === "" || v === undefined ? undefined : v));

const baseOperationSiteFields = {
  operation_id: z
    .string()
    .min(1, "Sélectionnez une opération.")
    .uuid("Identifiant opération invalide."),
  label: z.string().min(1, "Libellé du site requis.").max(500),
  sequence_number: optionalInt,
  is_primary: z.boolean().optional().default(false),
  site_kind: optionalSiteKind,
  activity_type: z.string().max(200).optional(),
  building_type: z.string().max(200).optional(),
  /** Colonne SQL `text` — pas un booléen en base. */
  dedicated_building: z.string().max(500).optional(),
  climate_zone: z.string().max(120).optional(),
  operating_mode: z.string().max(200).optional(),
  height_m: optionalNumber,
  volume_m3: optionalNumber,
  area_m2: optionalNumber,
  flow_type: z.string().max(120).optional(),
  heating_system_type: z.string().max(200).optional(),
  convective_power_kw: optionalNumber,
  radiant_power_kw: optionalNumber,
  calculated_power_kw: optionalNumber,
  air_flow_required_m3h: optionalNumber,
  destratifier_quantity_required: optionalInt,
  notes: z.string().max(20_000).optional(),
};

export const OperationSiteInsertSchema = z.object(baseOperationSiteFields);

export const OperationSiteUpdatePayloadSchema = z.intersection(
  z.object({
    id: z.string().uuid("Identifiant invalide."),
  }),
  OperationSiteInsertSchema,
);

/** Alias demandé par la spec (payload id + champs site). */
export const OperationSiteUpdateSchema = OperationSiteUpdatePayloadSchema;

export type OperationSiteInsertInput = z.infer<typeof OperationSiteInsertSchema>;
export type OperationSiteUpdatePayload = z.infer<typeof OperationSiteUpdatePayloadSchema>;
export type OperationSiteFormInput = z.input<typeof OperationSiteInsertSchema>;
