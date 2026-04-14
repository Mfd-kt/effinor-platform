import { z } from "zod";

const optionalUuid = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value.trim() === "") return undefined;
    return value.trim();
  })
  .pipe(z.union([z.string().uuid(), z.undefined()]));

const jsonRecord = z.record(z.string(), z.unknown()).optional();

export const AgentProspectSchema = z.object({
  companyName: z.string().min(1, "La société est obligatoire.").max(500),
  civility: z.string().max(20).optional(),
  contactName: z.string().min(1, "Le nom du contact est obligatoire.").max(200),
  phone: z.string().min(1, "Le téléphone est obligatoire.").max(50),
  email: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : undefined))
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), { message: "Email invalide." }),
  address: z.string().max(2000).optional(),
  city: z.string().max(120).optional(),
  postalCode: z.string().max(20).optional(),
  notes: z.string().max(10000).optional(),
});

export const AgentWorkflowPayloadSchema = z.object({
  workflowId: optionalUuid,
  leadId: optionalUuid,
  ceeSheetId: z.string().uuid(),
  prospect: AgentProspectSchema,
  simulationInputJson: jsonRecord,
  simulationResultJson: jsonRecord,
});

export const AgentSendToConfirmateurSchema = AgentWorkflowPayloadSchema.extend({
  assignedConfirmateurUserId: optionalUuid,
});

export type AgentWorkflowPayloadInput = z.infer<typeof AgentWorkflowPayloadSchema>;
