import { describe, expect, it } from "vitest";

import { filterParasiteNotes } from "./filter-study-notes";

describe("filterParasiteNotes", () => {
  it("retire les lignes triviales", () => {
    expect(filterParasiteNotes(["Bonjour", "  ", "Visite terrain à planifier"])).toEqual([
      "Visite terrain à planifier",
    ]);
  });

  it("conserve les notes utiles", () => {
    expect(filterParasiteNotes(["Attestation consuel à prévoir", "Note 2"])).toEqual([
      "Attestation consuel à prévoir",
      "Note 2",
    ]);
  });
});
