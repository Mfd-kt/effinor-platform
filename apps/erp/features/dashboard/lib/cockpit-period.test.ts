import { describe, expect, it } from "vitest";

import {
  getCockpitComparisonPeriodLabel,
  getCockpitPeriodLabel,
  getCockpitPeriodRange,
  getCockpitPreviousPeriodRange,
  isDateInCockpitPeriod,
} from "./cockpit-period";
import { getParisDayRangeIso } from "@/lib/datetime/paris-day";

describe("getCockpitPeriodRange", () => {
  it("termine toujours à « maintenant »", () => {
    const now = new Date("2026-06-15T14:30:00.000Z");
    const r = getCockpitPeriodRange("month", now);
    expect(r.endIso).toBe(now.toISOString());
    expect(new Date(r.startIso).getTime()).toBeLessThan(now.getTime());
  });

  it("« today » aligne le début sur le jour Paris", () => {
    const now = new Date("2026-04-11T10:00:00.000Z");
    expect(getCockpitPeriodRange("today", now).startIso).toBe(getParisDayRangeIso(now).startIso);
  });
});

describe("getCockpitPreviousPeriodRange", () => {
  it("« days30 » recule de 30 jours la fenêtre", () => {
    const now = new Date("2026-04-11T12:00:00.000Z");
    const cur = getCockpitPeriodRange("days30", now);
    const prev = getCockpitPreviousPeriodRange("days30", now);
    const curLen = new Date(cur.endIso).getTime() - new Date(cur.startIso).getTime();
    const prevLen = new Date(prev.endIso).getTime() - new Date(prev.startIso).getTime();
    expect(Math.round(curLen / 86_400_000)).toBe(30);
    expect(Math.round(prevLen / 86_400_000)).toBe(30);
    expect(new Date(prev.endIso).getTime()).toBe(new Date(cur.startIso).getTime());
  });
});

describe("isDateInCockpitPeriod", () => {
  it("inclut start, exclut end", () => {
    const now = new Date("2026-04-11T15:00:00.000Z");
    const { startIso, endIso } = getCockpitPeriodRange("today", now);
    expect(isDateInCockpitPeriod(startIso, "today", now)).toBe(true);
    expect(isDateInCockpitPeriod(endIso, "today", now)).toBe(false);
  });
});

describe("libellés", () => {
  it("expose des libellés stables", () => {
    expect(getCockpitPeriodLabel("week")).toBe("Semaine en cours");
    expect(getCockpitComparisonPeriodLabel("month")).toBe("Même période le mois précédent");
  });
});
