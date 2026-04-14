import { describe, expect, it } from "vitest";

import { canTransmitToCloser } from "@/features/cee-workflows/lib/confirmateur-handoff";

describe("canTransmitToCloser", () => {
  it("allows handoff when qualification checks are complete (documents générés côté closer)", () => {
    expect(
      canTransmitToCloser({
        dossier_complet: true,
        coherence_simulation: true,
        technical_feasibility: true,
      }),
    ).toBe(true);
  });

  it("blocks handoff when qualification is incomplete", () => {
    expect(
      canTransmitToCloser({
        dossier_complet: false,
        coherence_simulation: true,
        technical_feasibility: true,
      }),
    ).toBe(false);
  });
});
