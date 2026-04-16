import { describe, expect, it } from "vitest";

import { SaveConfirmateurQualificationSchema } from "@/features/cee-workflows/schemas/confirmateur-workspace.schema";

describe("SaveConfirmateurQualificationSchema", () => {
  it("accepts a complete qualification payload", () => {
    const parsed = SaveConfirmateurQualificationSchema.safeParse({
      workflowId: "550e8400-e29b-41d4-a716-446655440000",
      qualification: {
        qualification_status: "qualifie",
        dossier_complet: true,
        coherence_simulation: true,
        technical_feasibility: true,
        missing_information: "",
        requires_technical_visit_override: null,
        quote_required_override: null,
      },
    });

    expect(parsed.success).toBe(true);
  });
});
