import { describe, expect, it } from "vitest";

import { phoneRdvReminderLevel } from "@/features/cee-workflows/lib/closer-phone-rdv-reminder";

describe("phoneRdvReminderLevel", () => {
  it("returns none when iso is null", () => {
    expect(phoneRdvReminderLevel(null, 0)).toBe("none");
  });

  it("returns overdue after the RDV", () => {
    expect(phoneRdvReminderLevel("2026-04-11T10:00:00.000Z", Date.parse("2026-04-11T10:01:00.000Z"))).toBe(
      "overdue",
    );
  });

  it("returns imminent within 15 minutes before", () => {
    const now = Date.parse("2026-04-11T09:50:00.000Z");
    expect(phoneRdvReminderLevel("2026-04-11T10:00:00.000Z", now)).toBe("imminent");
  });

  it("returns soon within one hour but after 15 minutes", () => {
    const now = Date.parse("2026-04-11T09:00:00.000Z");
    expect(phoneRdvReminderLevel("2026-04-11T09:30:00.000Z", now)).toBe("soon");
  });

  it("returns upcoming within 24 hours", () => {
    const now = Date.parse("2026-04-11T09:00:00.000Z");
    expect(phoneRdvReminderLevel("2026-04-11T20:00:00.000Z", now)).toBe("upcoming");
  });

  it("returns none when more than 24 hours away", () => {
    const now = Date.parse("2026-04-11T09:00:00.000Z");
    expect(phoneRdvReminderLevel("2026-04-13T10:00:00.000Z", now)).toBe("none");
  });
});
