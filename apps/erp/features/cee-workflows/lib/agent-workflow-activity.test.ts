import { describe, expect, it } from "vitest";

import type { AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";
import {
  classifyAgentActivity,
  resolveAgentInitialSheetId,
} from "@/features/cee-workflows/lib/agent-workflow-activity";

describe("resolveAgentInitialSheetId", () => {
  const sheets = [
    {
      id: "sheet-led",
      code: "LED-01",
      label: "LED",
      simulatorKey: "led",
      calculationProfile: null,
      workflowKey: null,
      presentationTemplateKey: null,
      agreementTemplateKey: null,
      requiresTechnicalVisit: false,
      requiresQuote: true,
      isCommercialActive: true,
      description: null,
      controlPoints: null,
      teamName: "Equipe LED",
      roles: ["agent"],
    },
    {
      id: "sheet-destrat",
      code: "DESTRAT-01",
      label: "Destrat",
      simulatorKey: "destrat",
      calculationProfile: null,
      workflowKey: null,
      presentationTemplateKey: null,
      agreementTemplateKey: null,
      requiresTechnicalVisit: false,
      requiresQuote: true,
      isCommercialActive: true,
      description: null,
      controlPoints: null,
      teamName: "Equipe Destrat",
      roles: ["agent"],
    },
  ];

  it("prefers the saved sheet when still authorized", () => {
    expect(resolveAgentInitialSheetId(sheets, "sheet-led")).toBe("sheet-led");
  });

  it("falls back to destrat when multiple sheets are available", () => {
    expect(resolveAgentInitialSheetId(sheets, null)).toBe("sheet-destrat");
  });

  it("prefers a sheet with inferred destrat when simulator_key was never set", () => {
    const inferred: AgentAvailableSheet[] = [
      sheets[0]!,
      {
        id: "sheet-bat",
        code: "BAT-TH-142 (v. A71.4)",
        label: "Système de déstratification d'air — tertiaire BAT-TH-142",
        simulatorKey: null,
        calculationProfile: "coeff_zone_system_power",
        workflowKey: null,
        presentationTemplateKey: null,
        agreementTemplateKey: null,
        requiresTechnicalVisit: false,
        requiresQuote: true,
        isCommercialActive: true,
        description: null,
        controlPoints: null,
        teamName: "Equipe BAT",
        roles: ["agent"],
      },
    ];
    expect(resolveAgentInitialSheetId(inferred, null)).toBe("sheet-bat");
  });
});

describe("classifyAgentActivity", () => {
  it("splits agent activity into useful buckets", () => {
    const activity = classifyAgentActivity(
      [
        {
          workflowId: "wf-1",
          leadId: "lead-1",
          companyName: "Acme",
          sheetCode: "DESTRAT-01",
          sheetLabel: "Destrat",
          workflowStatus: "draft",
          updatedAt: "2026-04-11T10:00:00.000Z",
          score: 82,
          savingEuro: null,
          recommendedModel: null,
          civility: null,
          contactName: null,
          phone: null,
          callbackAt: null,
          email: null,
          address: null,
          city: null,
          postalCode: null,
          notes: null,
          simulationInputJson: {},
          simulationResultJson: {},
        },
        {
          workflowId: "wf-2",
          leadId: "lead-2",
          companyName: "Beta",
          sheetCode: "DESTRAT-01",
          sheetLabel: "Destrat",
          workflowStatus: "simulation_done",
          updatedAt: "2026-04-11T12:00:00.000Z",
          score: 91,
          savingEuro: 1200,
          recommendedModel: "mod-a",
          civility: null,
          contactName: null,
          phone: null,
          callbackAt: null,
          email: null,
          address: null,
          city: null,
          postalCode: null,
          notes: null,
          simulationInputJson: {},
          simulationResultJson: {},
        },
        {
          workflowId: "wf-3",
          leadId: "lead-3",
          companyName: "Gamma",
          sheetCode: "DESTRAT-01",
          sheetLabel: "Destrat",
          workflowStatus: "to_confirm",
          updatedAt: "2026-04-10T12:00:00.000Z",
          score: 70,
          savingEuro: 800,
          recommendedModel: null,
          civility: null,
          contactName: null,
          phone: null,
          callbackAt: null,
          email: null,
          address: null,
          city: null,
          postalCode: null,
          notes: null,
          simulationInputJson: {},
          simulationResultJson: {},
        },
      ],
      "2026-04-11",
    );

    expect(activity.drafts).toHaveLength(1);
    expect(activity.validatedToday).toHaveLength(1);
    expect(activity.sentToConfirmateur).toHaveLength(1);
    expect(activity.recent[0]?.workflowId).toBe("wf-2");
  });
});
