import { describe, expect, it } from "vitest";

import { assertCommercialSheetIsActive } from "@/features/cee-workflows/domain/sheet";

describe("assertCommercialSheetIsActive", () => {
  it("accepts an active commercial sheet", () => {
    expect(() =>
      assertCommercialSheetIsActive({ is_commercial_active: true, label: "BAT-SECT-104" }),
    ).not.toThrow();
  });

  it("rejects an inactive sheet with a clear message", () => {
    expect(() =>
      assertCommercialSheetIsActive({ is_commercial_active: false, label: "BAR-TH-145" }),
    ).toThrow('La fiche CEE "BAR-TH-145" est inactive.');
  });
});
