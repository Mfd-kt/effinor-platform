import { z } from "zod";

const optionalUuid = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value.trim() === "") return undefined;
    return value.trim();
  })
  .pipe(z.union([z.string().uuid(), z.undefined()]));

const qualificationRecord = z.object({
  qualification_status: z.string().min(1).max(80),
  dossier_complet: z.boolean(),
  coherence_simulation: z.boolean(),
  technical_feasibility: z.boolean(),
  missing_information: z.string().max(5000).optional().nullable(),
  confirmateur_notes: z.string().max(10000).optional().nullable(),
  closer_handover_notes: z.string().max(10000).optional().nullable(),
  requires_technical_visit_override: z.boolean().nullable().optional(),
  quote_required_override: z.boolean().nullable().optional(),
});

export const SaveConfirmateurQualificationSchema = z.object({
  workflowId: z.string().uuid(),
  qualification: qualificationRecord,
});

export const SendConfirmateurToCloserSchema = z.object({
  workflowId: z.string().uuid(),
  assignedCloserUserId: optionalUuid,
  qualification: qualificationRecord,
});

export type ConfirmateurQualificationInput = z.infer<typeof SaveConfirmateurQualificationSchema>["qualification"];
