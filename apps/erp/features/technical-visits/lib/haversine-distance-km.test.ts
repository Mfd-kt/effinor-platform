import { describe, expect, test } from "vitest";

import { formatDistanceKmLabel, haversineDistanceKm } from "@/features/technical-visits/lib/haversine-distance-km";

describe("haversine-distance-km", () => {
  test("returns null when coords missing or invalid", () => {
    expect(haversineDistanceKm(null, 2.3, 48.8, 2.4)).toBeNull();
    expect(haversineDistanceKm(48.8, null, 48.8, 2.4)).toBeNull();
    expect(haversineDistanceKm(120, 2.3, 48.8, 2.4)).toBeNull();
  });

  test("computes rounded distance", () => {
    const km = haversineDistanceKm(48.7666, 2.3927, 48.8566, 2.3522);
    expect(km).not.toBeNull();
    expect(Number.isInteger((km ?? 0) * 10)).toBe(true);
  });

  test("formats label safely", () => {
    expect(formatDistanceKmLabel(null)).toBe("Distance indisponible");
    expect(formatDistanceKmLabel(18.4)).toContain("km");
  });
});
