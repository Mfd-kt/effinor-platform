import { z } from "zod";

const uuid = z.string().uuid("Identifiant d’attribution invalide.");

export const updateLeadGenerationAssignmentCallTraceSchema = z
  .object({
    assignmentId: uuid,
    last_call_status: z.string().max(120).optional(),
    last_call_at: z.string().max(40).optional(),
    last_call_note: z.string().max(8000).optional(),
    last_call_recording_url: z.string().max(2000).optional(),
  })
  .transform((o) => ({
    assignmentId: o.assignmentId,
    last_call_status: o.last_call_status?.trim() ? o.last_call_status.trim() : null,
    last_call_at: o.last_call_at?.trim() ? o.last_call_at.trim() : null,
    last_call_note: o.last_call_note?.trim() ? o.last_call_note.trim() : null,
    last_call_recording_url: o.last_call_recording_url?.trim() ? o.last_call_recording_url.trim() : null,
  }))
  .superRefine((o, ctx) => {
    if (o.last_call_recording_url) {
      try {
        const u = new URL(o.last_call_recording_url);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "URL invalide (http ou https).",
            path: ["last_call_recording_url"],
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "URL invalide.",
          path: ["last_call_recording_url"],
        });
      }
    }
  });

export type UpdateLeadGenerationAssignmentCallTraceInput = z.infer<
  typeof updateLeadGenerationAssignmentCallTraceSchema
>;
