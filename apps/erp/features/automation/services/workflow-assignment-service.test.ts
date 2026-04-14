import { describe, expect, it } from "vitest";

import { pickLeastLoadedUser, type UserLoad } from "./workflow-assignment-service";

describe("pickLeastLoadedUser", () => {
  it("choisit le moins chargé", () => {
    const loads: UserLoad[] = [
      { userId: "b", load: 3 },
      { userId: "a", load: 1 },
    ];
    expect(pickLeastLoadedUser(loads)).toBe("a");
  });

  it("retourne null si vide", () => {
    expect(pickLeastLoadedUser([])).toBeNull();
  });
});
