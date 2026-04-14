import { z } from "zod";

export const DelegatorUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nom requis.").max(200),
  company_name: z.string().max(200).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  contact_name: z.string().max(200).optional().nullable(),
  contact_phone: z.string().max(40).optional().nullable(),
  contact_email: z.string().max(200).optional().nullable(),
  siret: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  contract_start_date: z.string().optional().nullable(),
  invoice_note: z.string().max(2000).optional().nullable(),
  /** Ex. « 0,0073 € par kWhc » */
  prime_per_kwhc_note: z.string().max(500).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  control_points: z.string().max(50_000).optional().nullable(),
});

export type DelegatorUpsertInput = z.infer<typeof DelegatorUpsertSchema>;

export const CeeSheetUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1, "Code fiche requis.").max(120),
  label: z.string().min(1, "Libellé requis.").max(300),
  description: z.string().max(2000).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(999999).optional(),
  simulator_key: z.string().max(120).optional().nullable(),
  presentation_template_key: z.string().max(200).optional().nullable(),
  agreement_template_key: z.string().max(200).optional().nullable(),
  workflow_key: z.string().max(120).optional().nullable(),
  requires_technical_visit: z.boolean().optional(),
  requires_quote: z.boolean().optional(),
  is_commercial_active: z.boolean().optional(),
  /** Critères de contrôle du dossier (texte libre). */
  control_points: z.string().max(50_000).optional().nullable(),
});

export type CeeSheetUpsertInput = z.infer<typeof CeeSheetUpsertSchema>;

export const IdSchema = z.object({
  id: z.string().uuid(),
});
