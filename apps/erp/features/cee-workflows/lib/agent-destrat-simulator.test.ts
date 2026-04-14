import { describe, expect, it } from "vitest";

import {
  computeAgentDestratPreview,
  extractAgentDestratStateFromJson,
} from "@/features/cee-workflows/lib/agent-destrat-simulator";

const validDestratForm = {
  buildingHeated: "yes" as const,
  localUsage: "commerce" as const,
  heightM: "7",
  surfaceM2: "2000",
  currentHeatingMode: "air_chaud_soufflage" as const,
  model: "generfeu" as const,
  consigne: "",
};

describe("computeAgentDestratPreview", () => {
  it("computes a destrat preview when CEE decision is DESTRAT", () => {
    const preview = computeAgentDestratPreview(validDestratForm);

    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.result.ceeSolution.solution).toBe("DESTRAT");
      expect(preview.result.neededDestrat).toBeGreaterThan(0);
    }
  });

  it("recommends PAC when destrat excluded (stockage)", () => {
    const preview = computeAgentDestratPreview({
      ...validDestratForm,
      localUsage: "stockage",
    });
    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.result.ceeSolution.solution).toBe("PAC");
      expect(preview.result.neededDestrat).toBe(0);
    }
  });

  it("destrat industriel (atelier) avec IND-BA-110 et chiffrage type industriel", () => {
    const preview = computeAgentDestratPreview({
      ...validDestratForm,
      localUsage: "atelier",
    });
    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.result.ceeSolution.solution).toBe("DESTRAT");
      expect(preview.result.ceeSolution.destratCeeSheetCode).toBe("IND-BA-110");
      expect(preview.result.clientType).toBe("Site industriel / logistique");
      expect(preview.result.neededDestrat).toBeGreaterThan(0);
    }
  });

  it("fails fast on incomplete input", () => {
    const preview = computeAgentDestratPreview({
      ...validDestratForm,
      localUsage: "",
    });

    expect(preview.ok).toBe(false);
  });
});

describe("extractAgentDestratStateFromJson", () => {
  it("hydrates agent state from legacy snapshot (clientType)", () => {
    expect(
      extractAgentDestratStateFromJson({
        input: {
          clientType: "Tertiaire",
          heightM: 6,
          surfaceM2: 1200,
          heatingMode: "elec",
          model: "teddington_ds7",
          consigne: "22°C",
        },
      }),
    ).toMatchObject({
      localUsage: "bureau",
      heightM: "6",
      surfaceM2: "1200",
      currentHeatingMode: "electrique_direct",
      model: "teddington_ds7",
      consigne: "22°C",
    });
  });
});
