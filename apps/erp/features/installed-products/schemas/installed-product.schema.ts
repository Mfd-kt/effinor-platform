import { z } from "zod";

const optionalUuidOrEmpty = z
  .string()
  .optional()
  .transform((s) => {
    if (s === undefined || s.trim() === "") return undefined;
    return s.trim();
  })
  .pipe(z.union([z.string().uuid(), z.undefined()]));

const optionalMoney = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
  const s = String(val).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const optionalPositiveNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
  const s = String(val).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const quantityField = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number") return val;
  const s = String(val).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}, z.number().positive("Quantité requise (supérieure à 0)."));

const baseInstalledProductFields = {
  product_id: z
    .string()
    .min(1, "Sélectionnez un produit catalogue.")
    .uuid("Identifiant produit invalide."),
  quantity: quantityField,
  unit_price_ht: optionalMoney,
  total_price_ht: optionalMoney,
  unit_power_w: optionalPositiveNumber,
  cee_sheet_code: z.string().max(120).optional(),
  cumac_amount: optionalPositiveNumber,
  valuation_amount: optionalMoney,
  notes: z.string().max(50_000).optional(),
};

export const InstalledProductInsertSchema = z.object(baseInstalledProductFields);

export const InstalledProductUpdatePayloadSchema = z.intersection(
  z.object({
    id: z.string().uuid("Identifiant invalide."),
  }),
  InstalledProductInsertSchema,
);

export type InstalledProductInsertInput = z.infer<typeof InstalledProductInsertSchema>;
export type InstalledProductUpdatePayload = z.infer<typeof InstalledProductUpdatePayloadSchema>;
export type InstalledProductFormInput = z.input<typeof InstalledProductInsertSchema>;
