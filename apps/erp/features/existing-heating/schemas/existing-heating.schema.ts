import { z } from "zod";

const optionalNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
  const s = String(val).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const quantityField = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
  const s = String(val).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}, z.number().positive("La quantité doit être supérieure à 0."));

const baseExistingHeatingFields = {
  heating_model_id: z
    .string()
    .min(1, "Sélectionnez un modèle de chauffage.")
    .uuid("Identifiant modèle invalide."),
  quantity: quantityField,
  unit_power_kw: optionalNumber,
  total_power_kw: optionalNumber,
  notes: z.string().max(20_000).optional(),
};

export const ExistingHeatingInsertSchema = z.object(baseExistingHeatingFields);

export const ExistingHeatingUpdatePayloadSchema = z.intersection(
  z.object({
    id: z.string().uuid("Identifiant invalide."),
  }),
  ExistingHeatingInsertSchema,
);

export const ExistingHeatingUpdateSchema = ExistingHeatingUpdatePayloadSchema;

export type ExistingHeatingInsertInput = z.infer<typeof ExistingHeatingInsertSchema>;
export type ExistingHeatingUpdatePayload = z.infer<typeof ExistingHeatingUpdatePayloadSchema>;
export type ExistingHeatingFormInput = z.input<typeof ExistingHeatingInsertSchema>;
