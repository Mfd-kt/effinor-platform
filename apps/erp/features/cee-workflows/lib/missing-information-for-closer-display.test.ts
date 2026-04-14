import { describe, expect, it } from "vitest";

import { missingInformationForCloserDisplay } from "@/features/cee-workflows/lib/missing-information-for-closer-display";

describe("missingInformationForCloserDisplay", () => {
  it("retourne le texte trimé quand présent", () => {
    expect(
      missingInformationForCloserDisplay({ missing_information: "  Manque le SIRET  " }),
    ).toBe("Manque le SIRET");
  });

  it("retourne null si absent ou vide", () => {
    expect(missingInformationForCloserDisplay({})).toBeNull();
    expect(missingInformationForCloserDisplay({ missing_information: "   " })).toBeNull();
    expect(missingInformationForCloserDisplay(null)).toBeNull();
    expect(missingInformationForCloserDisplay([])).toBeNull();
  });

  it("ignore un type non string", () => {
    expect(missingInformationForCloserDisplay({ missing_information: 12 })).toBeNull();
  });
});
