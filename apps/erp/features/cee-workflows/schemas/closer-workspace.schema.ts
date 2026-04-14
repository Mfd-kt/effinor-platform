import { z } from "zod";

const optionalDateTime = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value.trim() === "") return null;
    return value.trim();
  });

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() ? value.trim() : null));

const optionalUuid = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value.trim() === "") return null;
    return value.trim();
  })
  .pipe(z.union([z.string().uuid(), z.null()]));

export const SaveCloserNotesSchema = z.object({
  workflowId: z.string().uuid(),
  closer_notes: optionalText,
  objection_code: optionalText,
  objection_detail: optionalText,
  last_contact_at: optionalDateTime,
  next_follow_up_at: optionalDateTime,
  call_outcome: optionalText,
  loss_reason: optionalText,
});

export const CloserSendAgreementSchema = z.object({
  workflowId: z.string().uuid(),
  leadId: z.string().uuid(),
  clientEmail: z.string().email(),
  clientName: z.string().optional().default(""),
  companyName: z.string().optional().default(""),
  siteName: z.string().optional().default(""),
  presentationUrl: z.string().url(),
  accordUrl: z.string().url(),
  emailVariant: z.enum(["A", "B"]).optional().default("A"),
});

export const CloserResendAgreementSchema = CloserSendAgreementSchema.extend({
  emailType: z.enum(["study", "relance_signature"]).optional().default("relance_signature"),
});

export const CloserMarkSignedSchema = z.object({
  workflowId: z.string().uuid(),
});

export const CloserMarkLostSchema = z.object({
  workflowId: z.string().uuid(),
  lossReason: optionalText,
});

export const CloserFollowUpSchema = z.object({
  workflowId: z.string().uuid(),
  next_follow_up_at: optionalDateTime,
  comment: optionalText,
});

export const CloserSendToSignatureSchema = z.object({
  workflowId: z.string().uuid(),
  leadId: z.string().uuid(),
  clientEmail: z.string().email(),
  clientName: z.string().optional().default(""),
  companyName: z.string().optional().default(""),
  siteName: z.string().optional().default(""),
  presentationUrl: z.string().url(),
  accordUrl: z.string().url(),
});

export const CloserAssignSchema = z.object({
  workflowId: z.string().uuid(),
  assignedCloserUserId: optionalUuid,
});

export const PrepareCloserCommercialDocumentsSchema = z.object({
  workflowId: z.string().uuid(),
  leadId: z.string().uuid(),
});

export type SaveCloserNotesInput = z.infer<typeof SaveCloserNotesSchema>;
