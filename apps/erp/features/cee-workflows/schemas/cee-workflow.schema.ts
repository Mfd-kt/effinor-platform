import { z } from "zod";

import { CEE_WORKFLOW_STATUS_VALUES } from "@/features/cee-workflows/domain/constants";

const optionalUuidOrNull = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value.trim() === "") return null;
    return value.trim();
  })
  .pipe(z.union([z.string().uuid(), z.null()]));

const jsonRecordSchema = z.record(z.string(), z.unknown());

export const CreateLeadSheetWorkflowSchema = z.object({
  leadId: z.string().uuid(),
  ceeSheetId: z.string().uuid(),
  workflowStatus: z.enum(CEE_WORKFLOW_STATUS_VALUES).optional(),
  assignmentPatch: z
    .object({
      ceeSheetTeamId: optionalUuidOrNull.optional(),
      assignedAgentUserId: optionalUuidOrNull.optional(),
      assignedConfirmateurUserId: optionalUuidOrNull.optional(),
      assignedCloserUserId: optionalUuidOrNull.optional(),
    })
    .optional(),
});

export const SwitchLeadCeeSheetWorkflowSchema = z.object({
  leadId: z.string().uuid(),
  newCeeSheetId: z.string().uuid(),
  copyRoleAssignments: z.boolean().optional(),
  syncProductInterest: z.boolean().optional(),
});

export const AssignWorkflowUsersSchema = z.object({
  workflowId: z.string().uuid(),
  ceeSheetTeamId: optionalUuidOrNull.optional(),
  assignedAgentUserId: optionalUuidOrNull.optional(),
  assignedConfirmateurUserId: optionalUuidOrNull.optional(),
  assignedCloserUserId: optionalUuidOrNull.optional(),
});

export const CompleteSimulationSchema = z.object({
  workflowId: z.string().uuid(),
  workflowStatus: z.enum(CEE_WORKFLOW_STATUS_VALUES).optional(),
  simulationInputJson: jsonRecordSchema,
  simulationResultJson: jsonRecordSchema,
});

export const WorkflowQualificationSchema = z.object({
  workflowId: z.string().uuid(),
  qualificationDataJson: jsonRecordSchema,
});

export const PrepareCommercialDocumentsSchema = z.object({
  workflowId: z.string().uuid(),
  presentationDocumentId: optionalUuidOrNull.optional(),
  agreementDocumentId: optionalUuidOrNull.optional(),
  quoteDocumentId: optionalUuidOrNull.optional(),
});

export const SendToRoleSchema = z.object({
  workflowId: z.string().uuid(),
  assignedUserId: optionalUuidOrNull.optional(),
});

export const MarkAgreementSentSchema = z.object({
  workflowId: z.string().uuid(),
  agreementDocumentId: optionalUuidOrNull.optional(),
  signatureProvider: z.string().max(120).optional().nullable(),
  signatureRequestId: z.string().max(250).optional().nullable(),
  signatureStatus: z.string().max(120).optional().nullable(),
});

export const MarkAgreementSignedSchema = z.object({
  workflowId: z.string().uuid(),
  signatureProvider: z.string().max(120).optional().nullable(),
  signatureRequestId: z.string().max(250).optional().nullable(),
  signatureStatus: z.string().max(120).optional().nullable(),
});

export const MarkWorkflowLostSchema = z.object({
  workflowId: z.string().uuid(),
  reason: z.string().max(5000).optional().nullable(),
  archive: z.boolean().optional(),
});

export const WorkflowEventSchema = z.object({
  workflowId: z.string().uuid(),
  eventType: z.string().min(1).max(120),
  eventLabel: z.string().min(1).max(500),
  payloadJson: jsonRecordSchema.optional(),
});
