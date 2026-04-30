import { z } from "zod";

export const LeadConversionSchema = z.object({
  leadId: z.string().uuid(),
  target: z.enum(["b2c", "b2b"]),
  confirmArchive: z.literal(true),
  reason: z.string().max(500).optional(),
});

export type LeadConversionPayload = z.infer<typeof LeadConversionSchema>;

export const LeadActivityEventInsertSchema = z.object({
  lead_id: z.string().uuid(),
  event_type: z.string().min(1),
  actor_user_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type LeadActivityEventInsert = z.infer<typeof LeadActivityEventInsertSchema>;
