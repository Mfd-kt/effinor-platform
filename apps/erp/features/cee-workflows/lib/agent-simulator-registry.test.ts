import { describe, expect, it } from "vitest";

import { resolveAgentSimulatorDefinition } from "@/features/cee-workflows/lib/agent-simulator-registry";

describe("resolveAgentSimulatorDefinition", () => {
  it("returns the destrat simulator for the destrat key", () => {
    expect(resolveAgentSimulatorDefinition("destrat").kind).toBe("destrat");
  });

  it("returns a clean placeholder for unsupported simulators", () => {
    expect(resolveAgentSimulatorDefinition("led")).toEqual({
      kind: "unsupported",
      title: "Simulateur bientôt disponible",
      description: 'Le simulateur "led" n\'est pas encore branché dans le poste agent.',
    });
  });

  it("infers destrat from coeff_zone_system_power when simulator_key is null", () => {
    expect(
      resolveAgentSimulatorDefinition({
        code: "BAT-TH-142",
        label: "Autre libellé",
        simulatorKey: null,
        calculationProfile: "coeff_zone_system_power",
      }).kind,
    ).toBe("destrat");
  });

  it("infers destrat from label when simulator_key is null", () => {
    expect(
      resolveAgentSimulatorDefinition({
        code: "X",
        label: "Système de déstratification d'air",
        simulatorKey: null,
        calculationProfile: null,
      }).kind,
    ).toBe("destrat");
  });
});
