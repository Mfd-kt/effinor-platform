import { describe, expect, it } from "vitest";

import {
  AdminCeeSheetSchema,
  AdminCeeSheetTeamMemberCreateSchema,
} from "@/features/cee-workflows/schemas/admin-cee-sheet.schema";

describe("AdminCeeSheetSchema", () => {
  it("validates a complete cee sheet payload", () => {
    const parsed = AdminCeeSheetSchema.safeParse({
      code: "BAT-TH-142",
      name: "Pompe a chaleur",
      category: "chauffage",
      sort_order: 120,
      is_commercial_active: true,
      simulator_key: "pac",
      presentation_template_key: "presentation_pac_v1",
      agreement_template_key: "agreement_pac_v1",
      workflow_key: "workflow_pac",
      requires_quote: true,
      description: "Fiche chauffage",
      control_points: "Verifier les justificatifs",
      internal_notes: "Priorite 2026",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects a missing simulator key", () => {
    const parsed = AdminCeeSheetSchema.safeParse({
      code: "BAT-TH-142",
      name: "PAC",
      simulator_key: "",
      presentation_template_key: "p",
      agreement_template_key: "a",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("AdminCeeSheetTeamMemberCreateSchema", () => {
  it("validates the team member role", () => {
    expect(
      AdminCeeSheetTeamMemberCreateSchema.safeParse({
        sheetId: "550e8400-e29b-41d4-a716-446655440000",
        teamId: "550e8400-e29b-41d4-a716-446655440001",
        userId: "550e8400-e29b-41d4-a716-446655440002",
        roleInTeam: "confirmateur",
        isActive: true,
      }).success,
    ).toBe(true);
  });
});
