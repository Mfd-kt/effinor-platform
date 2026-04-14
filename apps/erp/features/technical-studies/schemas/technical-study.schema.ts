import { z } from "zod";

import type { StudyType, TechnicalStudyStatus } from "@/types/database.types";

export const STUDY_TYPE_VALUES = [
  "dimensioning_note",
  "lighting_study",
  "technical_assessment",
  "cold_recovery_study",
  "other",
] as const satisfies readonly StudyType[];

export const TECHNICAL_STUDY_STATUS_VALUES = [
  "draft",
  "in_review",
  "approved",
  "rejected",
  "archived",
] as const satisfies readonly TechnicalStudyStatus[];

const optionalDateInput = z
  .string()
  .optional()
  .transform((s) => {
    if (s === undefined || s.trim() === "") return undefined;
    return s.trim();
  });

const baseTechnicalStudyFields = {
  primary_document_id: z
    .string()
    .min(1, "Sélectionnez un document du référentiel.")
    .uuid("Identifiant document invalide."),
  study_type: z.enum(STUDY_TYPE_VALUES),
  /** Colonne SQL NOT NULL — référence métier de l’étude. */
  reference: z.string().min(1, "Référence requise.").max(200),
  status: z.enum(TECHNICAL_STUDY_STATUS_VALUES),
  study_date: optionalDateInput,
  engineering_office: z.string().max(300).optional(),
  summary: z.string().max(50_000).optional(),
};

export const TechnicalStudyInsertSchema = z.object(baseTechnicalStudyFields);

export const TechnicalStudyUpdatePayloadSchema = z.intersection(
  z.object({
    id: z.string().uuid("Identifiant invalide."),
  }),
  TechnicalStudyInsertSchema,
);

export const TechnicalStudyUpdateSchema = TechnicalStudyUpdatePayloadSchema;

export type TechnicalStudyInsertInput = z.infer<typeof TechnicalStudyInsertSchema>;
export type TechnicalStudyUpdatePayload = z.infer<typeof TechnicalStudyUpdatePayloadSchema>;
export type TechnicalStudyFormInput = z.input<typeof TechnicalStudyInsertSchema>;
