import { describe, expect, it } from "vitest";

import { resolveAgentSimulatorHeadlines } from "./agent-simulator-headlines";

describe("resolveAgentSimulatorHeadlines", () => {
  it("switches dialog title to PAC when preview is PAC", () => {
    const h = resolveAgentSimulatorHeadlines("Destratificateur d'air", "BAT-X", {
      ceeSolution: { solution: "PAC", eligible: true, reason: "", commercialMessage: "" },
    } as never);
    expect(h.dialogTitle).toContain("Pompe à chaleur");
    expect(h.dialogTitle).toContain("BAT-TH-163");
    expect(h.contextBadge).toBe("BAT-TH-163");
  });

  it("keeps sheet label for DESTRAT", () => {
    const h = resolveAgentSimulatorHeadlines("Destratificateur d'air", "DESTRAT", {
      ceeSolution: {
        solution: "DESTRAT",
        eligible: true,
        reason: "",
        commercialMessage: "",
        destratCeeSheetCode: "BAT-TH-142",
      },
    } as never);
    expect(h.dialogTitle).toBe("Simulateur — Destratificateur d'air");
    expect(h.contextBadge).toBe("BAT-TH-142");
  });
});
