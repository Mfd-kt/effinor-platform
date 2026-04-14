import { describe, expect, it } from "vitest";

import { getRecommendedProductCodes, allDestratProductCodes } from "./recommend";

describe("getRecommendedProductCodes", () => {
  it("returns teddington_ds3 as primary for that model", () => {
    const result = getRecommendedProductCodes("teddington_ds3");
    expect(result.primary).toBe("teddington_ds3");
    expect(result.alternatives).not.toContain("teddington_ds3");
    expect(result.alternatives).toContain("teddington_ds7");
    expect(result.alternatives).toContain("generfeu");
  });

  it("returns generfeu as primary for that model", () => {
    const result = getRecommendedProductCodes("generfeu");
    expect(result.primary).toBe("generfeu");
    expect(result.alternatives).toHaveLength(2);
  });
});

describe("allDestratProductCodes", () => {
  it("returns all 3 codes", () => {
    const codes = allDestratProductCodes();
    expect(codes).toHaveLength(3);
    expect(codes).toContain("teddington_ds3");
    expect(codes).toContain("teddington_ds7");
    expect(codes).toContain("generfeu");
  });
});
