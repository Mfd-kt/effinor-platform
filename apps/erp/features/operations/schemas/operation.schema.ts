import { z } from "zod";

import type {
  AdminStatus,
  OperationStatus,
  SalesStatus,
  TechnicalStatus,
} from "@/types/database.types";

/** Workflow affiché dans les formulaires et filtres (ordre métier). */
export const OPERATION_WORKFLOW_STATUS_VALUES = [
  "draft",
  "technical_qualification",
  "quote_preparation",
  "quote_sent",
  "quote_signed",
  "installation_planned",
  "installation_in_progress",
  "installation_completed",
  "delivered_without_install",
  "cee_compliance_review",
  "dossier_complete",
  "anomaly_to_resubmit",
  "polluter_filed",
  "cofrac_control",
  "invoicing_call",
  "payment_pending",
  "prime_paid",
  "cancelled_off_target",
  "not_eligible",
  "cancelled_by_client",
  "delivery_requested",
] as const satisfies readonly OperationStatus[];

/** Anciennes valeurs encore présentes en base avant migration complète. */
export const LEGACY_OPERATION_STATUS_VALUES = [
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
  "archived",
] as const satisfies readonly OperationStatus[];

export const OPERATION_STATUS_ALL_VALUES = [
  ...OPERATION_WORKFLOW_STATUS_VALUES,
  ...LEGACY_OPERATION_STATUS_VALUES,
] as const satisfies readonly OperationStatus[];

/** Alias : listes déroulantes = workflow uniquement. */
export const OPERATION_STATUS_VALUES = OPERATION_WORKFLOW_STATUS_VALUES;

export const SALES_STATUS_VALUES = [
  "draft",
  "to_contact",
  "qualified",
  "proposal",
  "quote_sent",
  "quote_signed",
  "won",
  "lost",
  "stalled",
] as const satisfies readonly SalesStatus[];

export const ADMIN_STATUS_VALUES = [
  "pending",
  "in_review",
  "complete",
  "blocked",
  "archived",
] as const satisfies readonly AdminStatus[];

export const TECHNICAL_STATUS_VALUES = [
  "pending",
  "study_in_progress",
  "validated",
  "blocked",
] as const satisfies readonly TechnicalStatus[];

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

const baseOperationFields = {
  operation_reference: z.string().max(80).optional(),
  beneficiary_id: z
    .string()
    .min(1, "Sélectionnez un bénéficiaire.")
    .uuid("Identifiant bénéficiaire invalide."),
  lead_id: optionalUuidOrEmpty,
  reference_technical_visit_id: optionalUuidOrEmpty,
  /** Référentiel — null si aucune fiche (sérialisable côté serveur, contrairement à undefined). */
  cee_sheet_id: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === undefined || v === null || v === "") return null;
      const t = String(v).trim();
      return t === "" ? null : t;
    })
    .pipe(z.union([z.string().uuid(), z.null()])),
  /** Valeurs pour les champs de la fiche (nombres, chaînes, ou clé `warehouses` : tableau de locaux). */
  cee_input_values: z.record(z.string(), z.any()).optional().default({}),
  /** Prime CEE en kWhc (saisie directe si profil « manual », sinon recalculée). */
  cee_kwhc_calculated: optionalMoney,
  cee_sheet_code: z.string().max(120).optional(),
  /** Libellé métier ; si absent, généré à l’enregistrement (code fiche ou référence). */
  title: z.string().max(500).optional(),
  operation_status: z.enum(
    OPERATION_STATUS_ALL_VALUES as unknown as [OperationStatus, ...OperationStatus[]],
  ),
  sales_status: z.enum(SALES_STATUS_VALUES),
  admin_status: z.enum(ADMIN_STATUS_VALUES),
  technical_status: z.enum(TECHNICAL_STATUS_VALUES),
  delegator_id: optionalUuidOrEmpty,
  sales_owner_id: optionalUuidOrEmpty,
  confirmer_id: optionalUuidOrEmpty,
  admin_owner_id: optionalUuidOrEmpty,
  technical_owner_id: optionalUuidOrEmpty,
  technical_visit_date: optionalDateTimeInput,
  quote_sent_at: optionalDateTimeInput,
  quote_signed_at: optionalDateTimeInput,
  installation_start_at: optionalDateTimeInput,
  installation_end_at: optionalDateTimeInput,
  deposit_date: optionalDateTimeInput,
  prime_paid_at: optionalDateTimeInput,
  estimated_quote_amount_ht: optionalMoney,
  estimated_prime_amount: optionalMoney,
  estimated_remaining_cost: optionalMoney,
  valuation_amount: optionalMoney,
  drive_url: optionalUrl,
  signature_url: optionalUrl,
  public_tracking_url: optionalUrl,
  risk_level: z.string().max(120).optional(),
  notes: z.string().max(10_000).optional(),
};

export const OperationInsertSchema = z
  .object(baseOperationFields)
  .superRefine((data, ctx) => {
    const hasSheet = data.cee_sheet_id != null;
    const hasCode = Boolean(data.cee_sheet_code?.trim());
    if (!hasSheet && !hasCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sélectionnez une fiche CEE dans le référentiel ou saisissez un code (dossier historique).",
        path: ["cee_sheet_id"],
      });
    }
  });

export const OperationUpdateSchema = z
  .object(baseOperationFields)
  .partial()
  .extend({
    id: z.string().uuid("Identifiant invalide."),
  });

export type OperationInsertInput = z.infer<typeof OperationInsertSchema>;
export type OperationUpdateInput = z.infer<typeof OperationUpdateSchema>;
