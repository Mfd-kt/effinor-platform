import { describe, expect, it } from "vitest";

import type { AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";
import { resolvePreferredCeeSheetIdForLead } from "@/features/cee-workflows/lib/resolve-preferred-cee-sheet-for-lead";

function sheet(partial: Partial<AgentAvailableSheet> & Pick<AgentAvailableSheet, "id">): AgentAvailableSheet {
  return {
    code: "X",
    label: "Y",
    simulatorKey: null,
    calculationProfile: null,
    workflowKey: null,
    presentationTemplateKey: null,
    agreementTemplateKey: null,
    requiresTechnicalVisit: false,
    requiresQuote: false,
    isCommercialActive: true,
    description: null,
    controlPoints: null,
    teamName: null,
    roles: [],
    ...partial,
  };
}

describe("resolvePreferredCeeSheetIdForLead", () => {
  it("utilise cee_sheet_id du lead s’il est dans la liste agent", () => {
    const sheets = [
      sheet({ id: "a", simulatorKey: "destrat" }),
      sheet({ id: "b", simulatorKey: "pac", code: "PAC", label: "Pac" }),
    ];
    expect(
      resolvePreferredCeeSheetIdForLead(sheets, {
        cee_sheet_id: "b",
        product_interest: "Destratificateur",
      }),
    ).toBe("b");
  });

  it("PAC : choisit la fiche dont simulator_key est pac", () => {
    const sheets = [
      sheet({ id: "d", simulatorKey: "destrat", label: "Destrat" }),
      sheet({ id: "p", simulatorKey: "pac", label: "Pac air eau" }),
    ];
    expect(
      resolvePreferredCeeSheetIdForLead(sheets, {
        cee_sheet_id: null,
        product_interest: "PAC",
      }),
    ).toBe("p");
  });

  it("Destratificateur : évite la clé pac", () => {
    const sheets = [
      sheet({ id: "p", simulatorKey: "pac" }),
      sheet({ id: "d", simulatorKey: "destrat" }),
    ];
    expect(
      resolvePreferredCeeSheetIdForLead(sheets, {
        cee_sheet_id: null,
        product_interest: "Destratificateur",
      }),
    ).toBe("d");
  });
});
