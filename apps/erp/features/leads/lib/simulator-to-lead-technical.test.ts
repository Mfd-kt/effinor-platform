import { describe, expect, it } from "vitest";

import {
  leadBuildingTypeFromSimulatorCee,
  leadHeatingTypesFromSimulator,
  parseWorkflowSimulationSnapshotJson,
} from "@/features/leads/lib/simulator-to-lead-technical";

describe("leadBuildingTypeFromSimulatorCee", () => {
  it("mappe logistique vers INDUSTRIE", () => {
    expect(leadBuildingTypeFromSimulatorCee("logistique", "entrepot")).toBe("INDUSTRIE");
  });

  it("distingue les usages tertiaires", () => {
    expect(leadBuildingTypeFromSimulatorCee("tertiaire", "commerce")).toBe("COMMERCES");
    expect(leadBuildingTypeFromSimulatorCee("tertiaire", "gymnase")).toBe("SPORT");
    expect(leadBuildingTypeFromSimulatorCee("tertiaire", "bureau")).toBe("TERTIAIRE");
  });
});

describe("leadHeatingTypesFromSimulator", () => {
  it("priorise le mode détaillé agent", () => {
    expect(leadHeatingTypesFromSimulator("electrique_direct", "gaz")).toEqual(["electricite"]);
    expect(leadHeatingTypesFromSimulator("rayonnement", "elec")).toEqual(["gaz"]);
    expect(leadHeatingTypesFromSimulator("pac_air_air", "gaz")).toEqual(["pac_air_air"]);
    expect(leadHeatingTypesFromSimulator("pac_air_eau", "elec")).toEqual(["pac_air_eau"]);
  });

  it("retombe sur le mode calculé", () => {
    expect(leadHeatingTypesFromSimulator(null, "fioul")).toEqual(["fioul"]);
    expect(leadHeatingTypesFromSimulator(undefined, "bois")).toEqual(["autres"]);
  });
});

describe("parseWorkflowSimulationSnapshotJson", () => {
  it("lit un snapshot complet", () => {
    const parsed = parseWorkflowSimulationSnapshotJson({
      version: "1",
      input: {
        isHeated: true,
        buildingType: "tertiaire",
        localUsage: "commerce",
        surfaceM2: 1200,
        heightM: 8,
        currentHeatingMode: "mix_air_rayonnement",
      },
      normalizedInput: {
        heatingMode: "gaz",
        surfaceM2: 1200,
        heightM: 8,
        buildingType: "tertiaire",
        localUsage: "commerce",
      },
      result: { heatingMode: "gaz", surfaceM2: 1200, heightM: 8 },
    });
    expect(parsed).not.toBeNull();
    expect(parsed?.surfaceM2).toBe(1200);
    expect(parsed?.heightM).toBe(8);
    expect(parsed?.currentHeatingMode).toBe("mix_air_rayonnement");
    expect(parsed?.computedHeatingMode).toBe("gaz");
    expect(parsed?.isHeated).toBe(true);
  });

  it("retourne null si incomplet", () => {
    expect(parseWorkflowSimulationSnapshotJson({ input: { surfaceM2: 1 } })).toBeNull();
  });
});
