import { describe, expect, test } from "vitest";

import { getDistanceContextFromAccess, getVisitDistanceForContext } from "@/features/technical-visits/lib/visit-distance-context";

describe("visit-distance-context", () => {
  test("uses technician origin in technician context", () => {
    const out = getVisitDistanceForContext({
      context: "technician",
      technician: { latitude: 48.85, longitude: 2.35 },
      visit: { site_lat: 48.86, site_lng: 2.36 },
    });
    expect(out.originType).toBe("technician");
    expect(out.distanceKm).not.toBeNull();
    expect(out.formattedDistance).toContain("km");
  });

  test("returns unavailable when technician coords absent", () => {
    const out = getVisitDistanceForContext({
      context: "technician",
      technician: { latitude: null, longitude: null },
      visit: { site_lat: 48.86, site_lng: 2.36 },
    });
    expect(out.distanceKm).toBeNull();
    expect(out.formattedDistance).toBe("Distance indisponible");
  });

  test("uses company origin in admin context", () => {
    const out = getVisitDistanceForContext({
      context: "admin",
      technician: null,
      visit: { site_lat: 48.86, site_lng: 2.36 },
    });
    expect(out.originType).toBe("company");
    expect(out.distanceKm).not.toBeNull();
  });

  test("detects access context", () => {
    expect(getDistanceContextFromAccess(undefined)).toBe("admin");
    expect(
      getDistanceContextFromAccess({
        kind: "authenticated",
        userId: "u1",
        roleCodes: ["technician"],
      } as never),
    ).toBe("technician");
  });
});
