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
      }),
    ).toBe("b");
  });

  it("sans cee_sheet_id : défaut poste agent (déstrat si présent)", () => {
    const sheets = [
      sheet({ id: "d", simulatorKey: "destrat", label: "Destrat" }),
      sheet({ id: "p", simulatorKey: "pac", label: "Pac air eau" }),
    ];
    expect(
      resolvePreferredCeeSheetIdForLead(sheets, {
        cee_sheet_id: null,
      }),
    ).toBe("d");
  });

  it("sans cee_sheet_id et une seule fiche : cette fiche", () => {
    const sheets = [sheet({ id: "p", simulatorKey: "pac" })];
    expect(
      resolvePreferredCeeSheetIdForLead(sheets, {
        cee_sheet_id: null,
      }),
    ).toBe("p");
  });
});
