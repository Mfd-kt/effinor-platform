import { z } from "zod";

import { LeadB2BPatchSchema } from "./lead-b2b.schema";
import { LeadB2CPatchSchema } from "./lead-b2c.schema";
import { LeadCommonUpdateSchema } from "./lead-common.schema";

export const LeadUpsertBundleSchema = z
  .object({
    /** Colonnes `public.leads` hors schéma commun (ex. company_name) : conservées pour le formulaire ERP. */
    lead: LeadCommonUpdateSchema.passthrough(),
    b2b: LeadB2BPatchSchema.optional(),
    b2c: LeadB2CPatchSchema.optional(),
  })
  .refine(
    () => true,
    { message: "Bundle inconsistency" },
  );

export type LeadUpsertBundlePayload = z.infer<typeof LeadUpsertBundleSchema>;
