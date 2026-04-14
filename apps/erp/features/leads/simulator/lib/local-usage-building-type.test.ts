import { describe, expect, it } from "vitest";

import { BUILDING_TYPE_FROM_LOCAL_USAGE, inferBuildingTypeFromLocalUsage } from "./local-usage-building-type";

describe("local-usage-building-type", () => {
  it("couvre tous les usages", () => {
    const usages = Object.keys(BUILDING_TYPE_FROM_LOCAL_USAGE);
    expect(usages).toHaveLength(13);
  });

  it("déduit logistique pour stockage", () => {
    expect(inferBuildingTypeFromLocalUsage("stockage")).toBe("logistique");
  });

  it("déduit tertiaire pour bureau", () => {
    expect(inferBuildingTypeFromLocalUsage("bureau")).toBe("tertiaire");
  });
});
