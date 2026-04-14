import { describe, expect, it } from "vitest";

import { pickPacCeeSheetIdFromRows } from "./pick-commercial-pac-cee-sheet";

describe("pickPacCeeSheetIdFromRows", () => {
  it("prefers simulator_key pac over pac_*", () => {
    const id = pickPacCeeSheetIdFromRows([
      { id: "b", simulator_key: "pac_air_eau" },
      { id: "a", simulator_key: "pac" },
    ]);
    expect(id).toBe("a");
  });

  it("falls back to first pac_ prefix", () => {
    const id = pickPacCeeSheetIdFromRows([
      { id: "x", simulator_key: "destrat" },
      { id: "p", simulator_key: "pac_custom" },
    ]);
    expect(id).toBe("p");
  });

  it("returns null when no pac keys", () => {
    expect(pickPacCeeSheetIdFromRows([{ id: "d", simulator_key: "destrat" }])).toBeNull();
  });
});
