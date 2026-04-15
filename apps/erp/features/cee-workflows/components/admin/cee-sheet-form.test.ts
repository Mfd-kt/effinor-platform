import { describe, expect, it } from "vitest";

import { formFromSheet } from "@/features/cee-workflows/components/admin/cee-sheet-form";

describe("formFromSheet", () => {
  it("maps an admin sheet row to editable form values", () => {
    expect(
      formFromSheet({
        id: "sheet-1",
        code: "BAT-TH-142",
        name: "PAC",
        category: "chauffage",
        sortOrder: 120,
        isCommercialActive: true,
        simulatorKey: "pac",
        presentationTemplateKey: "presentation_pac_v1",
        agreementTemplateKey: "agreement_pac_v1",
        workflowKey: "workflow_pac",
        requiresTechnicalVisit: true,
        technicalVisitTemplateKey: null,
        technicalVisitTemplateVersion: null,
        requiresQuote: true,
        description: "Description",
        controlPoints: "Controle",
        internalNotes: "Notes",
        teamConfigured: true,
        memberCount: 3,
        teamName: "Equipe PAC",
      }),
    ).toMatchObject({
      id: "sheet-1",
      code: "BAT-TH-142",
      name: "PAC",
      category: "chauffage",
      simulator_key: "pac",
      presentation_template_key: "presentation_pac_v1",
      agreement_template_key: "agreement_pac_v1",
    });
  });
});
