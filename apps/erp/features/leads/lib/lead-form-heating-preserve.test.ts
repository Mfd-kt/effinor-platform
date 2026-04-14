import { describe, expect, it } from "vitest";

import { mergeLeadPayloadPreservingUntouchedHeating } from "@/features/leads/lib/lead-form-heating-preserve";
import type { LeadInsertInput } from "@/features/leads/schemas/lead.schema";

const basePayload = {
  source: "cold_call",
  company_name: "Test",
  lead_status: "new",
} as LeadInsertInput;

describe("mergeLeadPayloadPreservingUntouchedHeating", () => {
  it("réinjecte les modes connus si le chauffage n’est pas dirty et le payload est vide", () => {
    const out = mergeLeadPayloadPreservingUntouchedHeating(
      { ...basePayload, heating_type: [] },
      { heatingFieldDirty: false, lastCommittedHeating: ["gaz", "fioul"] },
    );
    expect(out.heating_type).toEqual(["gaz", "fioul"]);
  });

  it("ne modifie pas le payload si le chauffage a été modifié", () => {
    const out = mergeLeadPayloadPreservingUntouchedHeating(
      { ...basePayload, heating_type: [] },
      { heatingFieldDirty: true, lastCommittedHeating: ["gaz"] },
    );
    expect(out.heating_type).toEqual([]);
  });

  it("laisse passer une saisie explicite même sans dirty (ref ne s’applique pas si le payload a des modes)", () => {
    const out = mergeLeadPayloadPreservingUntouchedHeating(
      { ...basePayload, heating_type: ["pac"] },
      { heatingFieldDirty: false, lastCommittedHeating: ["gaz"] },
    );
    expect(out.heating_type).toEqual(["pac"]);
  });

  it("ne réinjecte pas s’il n’y a pas de dernier état connu", () => {
    const out = mergeLeadPayloadPreservingUntouchedHeating(
      { ...basePayload, heating_type: [] },
      { heatingFieldDirty: false, lastCommittedHeating: undefined },
    );
    expect(out.heating_type).toEqual([]);
  });
});
