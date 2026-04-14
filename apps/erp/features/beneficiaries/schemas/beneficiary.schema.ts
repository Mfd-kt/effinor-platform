import { z } from "zod";

import type { BeneficiaryStatus } from "@/types/database.types";

export const BENEFICIARY_STATUS_VALUES = [
  "prospect",
  "active",
  "inactive",
  "blocked",
] as const satisfies readonly BeneficiaryStatus[];

const optionalEmail = z
  .string()
  .optional()
  .refine(
    (val) =>
      val === undefined ||
      val.trim() === "" ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
    { message: "Email invalide." },
  );

const baseBeneficiaryFields = {
  company_name: z.string().min(1, "La raison sociale est obligatoire.").max(500),
  siren: z.string().max(20).optional(),
  siret_head_office: z.string().max(20).optional(),
  siret_worksite: z.string().max(20).optional(),
  civility: z.string().max(20).optional(),
  contact_first_name: z.string().max(120).optional(),
  contact_last_name: z.string().max(120).optional(),
  contact_role: z.string().max(120).optional(),
  phone: z.string().max(50).optional(),
  landline: z.string().max(50).optional(),
  email: optionalEmail,
  head_office_address: z.string().max(500).optional(),
  head_office_postal_code: z.string().max(20).optional(),
  head_office_city: z.string().max(120).optional(),
  worksite_address: z.string().max(500).optional(),
  worksite_postal_code: z.string().max(20).optional(),
  worksite_city: z.string().max(120).optional(),
  climate_zone: z.string().max(80).optional(),
  region: z.string().max(120).optional(),
  acquisition_source: z.string().max(200).optional(),
  status: z.enum(BENEFICIARY_STATUS_VALUES),
  notes: z.string().max(10_000).optional(),
};

export const BeneficiaryInsertSchema = z.object(baseBeneficiaryFields);

export const BeneficiaryUpdateSchema = z
  .object(baseBeneficiaryFields)
  .partial()
  .extend({
    id: z.string().uuid("Identifiant invalide."),
  });

export type BeneficiaryInsertInput = z.infer<typeof BeneficiaryInsertSchema>;
export type BeneficiaryUpdateInput = z.infer<typeof BeneficiaryUpdateSchema>;
