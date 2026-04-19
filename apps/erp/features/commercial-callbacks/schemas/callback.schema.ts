import { z } from "zod";

import {
  CALLBACK_PRIORITIES,
  CALLBACK_STATUSES,
  CALLBACK_TIME_WINDOWS,
  PROSPECT_TEMPERATURES,
} from "@/features/commercial-callbacks/domain/callback-status";

const optionalEmail = z
  .string()
  .optional()
  .transform((s) => {
    if (s === undefined || s === null) return undefined;
    const t = s.trim();
    return t === "" ? undefined : t;
  })
  .refine((v) => v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: "E-mail invalide.",
  });

export const CreateCommercialCallbackSchema = z.object({
  company_name: z.string().min(1, "Société obligatoire.").max(500),
  contact_name: z.string().min(1, "Contact obligatoire.").max(300),
  phone: z.string().min(1, "Téléphone obligatoire.").max(50),
  email: optionalEmail,
  callback_date: z.string().min(1, "Date de rappel obligatoire."),
  callback_time: z
    .string()
    .optional()
    .transform((s) => (s === undefined || s.trim() === "" ? undefined : s.trim())),
  callback_time_window: z.enum(CALLBACK_TIME_WINDOWS).optional().nullable(),
  callback_comment: z.string().min(1, "Commentaire obligatoire.").max(20_000),
  priority: z.enum(CALLBACK_PRIORITIES).optional().default("normal"),
  source: z.string().max(200).optional().nullable(),
  assigned_agent_user_id: z.string().uuid().optional().nullable(),
  call_context_summary: z.string().max(2000).optional().nullable(),
  prospect_temperature: z.enum(PROSPECT_TEMPERATURES).optional().nullable(),
  estimated_value_eur: z
    .number()
    .nonnegative()
    .max(100_000_000)
    .optional()
    .nullable(),
});

export type CreateCommercialCallbackInput = z.infer<typeof CreateCommercialCallbackSchema>;

export const UpdateCommercialCallbackSchema = z.object({
  id: z.string().uuid(),
  company_name: z.string().min(1).max(500).optional(),
  contact_name: z.string().min(1).max(300).optional(),
  phone: z.string().min(1).max(50).optional(),
  email: optionalEmail,
  callback_date: z.string().min(1).optional(),
  callback_time: z
    .string()
    .optional()
    .transform((s) => (s === undefined || s.trim() === "" ? undefined : s.trim())),
  callback_time_window: z.enum(CALLBACK_TIME_WINDOWS).optional().nullable(),
  callback_comment: z.string().min(1).max(20_000).optional(),
  priority: z.enum(CALLBACK_PRIORITIES).optional(),
  source: z.string().max(200).optional().nullable(),
  status: z.enum(CALLBACK_STATUSES).optional(),
  call_context_summary: z.string().max(2000).optional().nullable(),
  prospect_temperature: z.enum(PROSPECT_TEMPERATURES).optional().nullable(),
  estimated_value_eur: z.number().nonnegative().max(100_000_000).optional().nullable(),
  /** Réassignation : réservée aux pilotes CEE côté serveur ; sinon seulement soi-même. */
  assigned_agent_user_id: z.string().uuid().optional().nullable(),
});

export type UpdateCommercialCallbackInput = z.infer<typeof UpdateCommercialCallbackSchema>;

export const RescheduleCommercialCallbackSchema = z.object({
  id: z.string().uuid(),
  callback_date: z.string().min(1),
  callback_time: z
    .string()
    .optional()
    .transform((s) => (s === undefined || s.trim() === "" ? undefined : s.trim())),
  callback_time_window: z.enum(CALLBACK_TIME_WINDOWS).optional().nullable(),
  note: z.string().max(5000).optional(),
});

export type RescheduleCommercialCallbackInput = z.infer<typeof RescheduleCommercialCallbackSchema>;
