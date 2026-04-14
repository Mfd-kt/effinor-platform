import { z } from "zod";

import type { DocumentStatus, DocumentType } from "@/types/database.types";

export const DOCUMENT_TYPE_VALUES = [
  "quote",
  "invoice",
  "delegate_invoice",
  "technical_study",
  "dimensioning_note",
  "cee_declaration",
  "photo",
  "contract",
  "proof",
  "correspondence",
  "other",
] as const satisfies readonly DocumentType[];

export const DOCUMENT_STATUS_VALUES = [
  "draft",
  "pending_review",
  "valid",
  "rejected",
  "superseded",
] as const satisfies readonly DocumentStatus[];

const optionalUuidOrEmpty = z
  .string()
  .optional()
  .transform((s) => {
    if (s === undefined || s.trim() === "") return undefined;
    return s.trim();
  })
  .pipe(z.union([z.string().uuid(), z.undefined()]));

const optionalUrl = z
  .string()
  .optional()
  .refine(
    (val) =>
      val === undefined ||
      val.trim() === "" ||
      /^https?:\/\/.+/i.test(val.trim()) ||
      /^mailto:/i.test(val.trim()),
    { message: "URL invalide." },
  );

const optionalMoney = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
  const s = String(val).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const optionalDateTimeInput = z
  .string()
  .optional()
  .transform((s) => {
    if (s === undefined || s.trim() === "") return undefined;
    return s.trim();
  });

const optionalDateInput = z
  .string()
  .optional()
  .transform((s) => {
    if (s === undefined || s.trim() === "") return undefined;
    return s.trim();
  });

const triStateBoolean = z
  .union([z.literal(""), z.literal("true"), z.literal("false")])
  .optional()
  .transform((v) => {
    if (v === undefined || v === "") return null;
    return v === "true";
  });

const optionalFileSize = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number") return Number.isFinite(val) && val >= 0 ? Math.floor(val) : undefined;
  const s = String(val).trim().replace(/\s/g, "");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}, z.number().optional());

const baseDocumentFields = {
  document_type: z.enum(DOCUMENT_TYPE_VALUES),
  document_subtype: z.string().max(200).optional(),
  version: z.coerce.number().int().min(1).default(1),
  document_status: z.enum(DOCUMENT_STATUS_VALUES),
  is_required: z.boolean().optional().default(false),
  is_signed_by_client: z.boolean().optional().default(false),
  is_signed_by_company: z.boolean().optional().default(false),
  is_compliant: triStateBoolean,
  issued_at: optionalDateTimeInput,
  signed_at: optionalDateTimeInput,
  checked_at: optionalDateTimeInput,
  checked_by_user_id: optionalUuidOrEmpty,
  document_number: z.string().max(120).optional(),
  document_date: optionalDateInput,
  amount_ht: optionalMoney,
  amount_ttc: optionalMoney,
  mime_type: z.string().max(120).optional(),
  file_size_bytes: optionalFileSize,
  storage_bucket: z.string().max(120).optional(),
  storage_path: z.string().max(2000).optional(),
  signed_storage_bucket: z.string().max(120).optional(),
  signed_storage_path: z.string().max(2000).optional(),
  signature_provider_url: optionalUrl,
  internal_comments: z.string().max(20_000).optional(),
};

export const DocumentInsertSchema = z.object(baseDocumentFields);

/** Payload serveur pour la mise à jour : identifiant + même schéma que la création. */
export const DocumentUpdatePayloadSchema = z.intersection(
  z.object({
    id: z.string().uuid("Identifiant invalide."),
  }),
  DocumentInsertSchema,
);

/** Valeurs parsées (après Zod), pour insert/update DB. */
export type DocumentInsertInput = z.infer<typeof DocumentInsertSchema>;
export type DocumentUpdatePayload = z.infer<typeof DocumentUpdatePayloadSchema>;

/** Valeurs formulaire RHF (avant transform), ex. `is_compliant` en tri-état chaîne. */
export type DocumentFormInput = z.input<typeof DocumentInsertSchema>;
