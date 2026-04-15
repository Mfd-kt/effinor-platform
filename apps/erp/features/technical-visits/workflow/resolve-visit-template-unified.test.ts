import { describe, expect, it, vi } from "vitest";

import { resolveVisitTemplateByKeyAndVersionUnified } from "./resolve-visit-template-unified";

describe("resolveVisitTemplateByKeyAndVersionUnified", () => {
  it("priorise le registry code sans interroger la base", async () => {
    const supabase = {
      from: vi.fn(() => {
        throw new Error("DB should not be queried when code registry matches");
      }),
    };
    const r = await resolveVisitTemplateByKeyAndVersionUnified(
      supabase as never,
      "BAT-TH-142",
      1,
    );
    expect(r).not.toBeNull();
    expect(r?.templateKey).toBe("BAT-TH-142");
    expect(r?.version).toBe(1);
  });
});
