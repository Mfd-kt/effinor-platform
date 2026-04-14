import { describe, expect, it } from "vitest";

import { assertAgentSimulationResultHealthy } from "./assert-simulation-result-healthy";

describe("assertAgentSimulationResultHealthy", () => {
  it("accepte un résultat déstrat avec volume > 0", () => {
    expect(() =>
      assertAgentSimulationResultHealthy({
        ceeSolution: { solution: "DESTRAT" },
        volumeM3: 5000,
      }),
    ).not.toThrow();
  });

  it("refuse un résultat déstrat avec volume nul", () => {
    expect(() =>
      assertAgentSimulationResultHealthy({
        ceeSolution: { solution: "DESTRAT" },
        volumeM3: 0,
      }),
    ).toThrow(/volume/);
  });

  it("accepte PAC avec pacSavings", () => {
    expect(() =>
      assertAgentSimulationResultHealthy({
        ceeSolution: { solution: "PAC" },
        volumeM3: 0,
        pacSavings: { annualCostSavings: 1000, annualEnergySavingsKwh: 5000, currentConsumptionKwh: 20000 },
      }),
    ).not.toThrow();
  });

  it("refuse PAC sans pacSavings", () => {
    expect(() =>
      assertAgentSimulationResultHealthy({
        ceeSolution: { solution: "PAC" },
        volumeM3: 0,
      }),
    ).toThrow(/pacSavings/);
  });
});
