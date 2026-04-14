import { describe, expect, it } from "vitest";

import { renderSlackText } from "@/features/notifications/domain/render-slack";

describe("renderSlackText", () => {
  it("renders title, lines and action link", () => {
    const text = renderSlackText({
      title: "Test titre",
      lines: ["Ligne 1", "Ligne 2"],
      severity: "info",
      channelKey: "alerts",
      actionUrl: "https://app.example/leads/1",
      actionLabel: "Ouvrir",
    });
    expect(text).toContain("Test titre");
    expect(text).toContain("Ligne 1");
    expect(text).toContain("https://app.example/leads/1");
  });
});
