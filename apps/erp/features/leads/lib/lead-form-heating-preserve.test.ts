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
      { heatingFieldDirty: false, lastCommittedHeating: ["chaudiere_eau", "rayonnement"] },
    );
    expect(out.heating_type).toEqual(["chaudiere_eau", "rayonnement"]);
  });

  it("ne modifie pas le payload si le chauffage a été modifié", () => {
    const out = mergeLeadPayloadPreservingUntouchedHeating(
      { ...basePayload, heating_type: [] },
      { heatingFieldDirty: true, lastCommittedHeating: ["chaudiere_eau"] },
    );
    expect(out.heating_type).toEqual([]);
  });

  it("laisse passer une saisie explicite même sans dirty (ref ne s’applique pas si le payload a des modes)", () => {
    const out = mergeLeadPayloadPreservingUntouchedHeating(
      { ...basePayload, heating_type: ["pac_air_eau"] },
      { heatingFieldDirty: false, lastCommittedHeating: ["chaudiere_eau"] },
    );
    expect(out.heating_type).toEqual(["pac_air_eau"]);
  });

  it("ne réinjecte pas s’il n’y a pas de dernier état connu", () => {
    const out = mergeLeadPayloadPreservingUntouchedHeating(
      { ...basePayload, heating_type: [] },
      { heatingFieldDirty: false, lastCommittedHeating: undefined },
    );
    expect(out.heating_type).toEqual([]);
  });
});
