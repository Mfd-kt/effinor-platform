import { describe, expect, it } from "vitest";

import { templateLeadCreated } from "@/features/notifications/domain/templates";

describe("notification templates", () => {
  it("templateLeadCreated includes pipeline and company", () => {
    const p = templateLeadCreated({
      companyName: "ACME",
      leadId: "uuid-1",
      sourceLabel: "Téléphone",
      leadStatus: "Nouveau",
      score: 80,
    });
    expect(p.title).toContain("lead");
    expect(p.lines?.join(" ")).toContain("ACME");
    expect(p.channelKey).toBe("commercial");
  });
});
