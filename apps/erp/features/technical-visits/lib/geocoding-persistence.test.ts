import { describe, expect, test } from "vitest";

import {
  geocodeNormalizedAddressWithFallbacks,
  nextGeocodingStatusFromAddress,
  shouldSkipGeocodingAttempt,
} from "@/features/technical-visits/lib/geocoding-persistence";

describe("geocoding-persistence", () => {
  test("does not skip when missing coords and no recent error", () => {
    expect(
      shouldSkipGeocodingAttempt({
        geocoding_status: "complete_not_geocoded",
        geocoding_updated_at: null,
        geocoding_attempts: 0,
        hasCoords: false,
      }),
    ).toBe(false);
  });

  test("skips on already geocoded or too many attempts", () => {
    expect(
      shouldSkipGeocodingAttempt({
        geocoding_status: "complete_geocoded",
        geocoding_updated_at: null,
        geocoding_attempts: 1,
        hasCoords: true,
      }),
    ).toBe(true);
    expect(
      shouldSkipGeocodingAttempt({
        geocoding_status: "geocoding_error",
        geocoding_updated_at: null,
        geocoding_attempts: 99,
        hasCoords: false,
      }),
    ).toBe(true);
  });

  test("derives next status from address completeness", () => {
    expect(nextGeocodingStatusFromAddress({ addressLine1: "1 rue", postalCode: "75001", city: "Paris", country: "France" })).toBe(
      "complete_not_geocoded",
    );
    expect(nextGeocodingStatusFromAddress({ postalCode: "75001" })).toBe("complete_not_geocoded");
    expect(nextGeocodingStatusFromAddress({ addressLine1: "1 rue" })).toBe("incomplete_address");
    expect(nextGeocodingStatusFromAddress({})).toBe("incomplete_address");
  });

  test("geocodes with fallback queries and provider", async () => {
    const provider = {
      async geocode(query: string) {
        if (query.includes("75001")) return { lat: 48.8, lng: 2.3, provider: "mock" };
        return null;
      },
    };
    const out = await geocodeNormalizedAddressWithFallbacks(
      { addressLine1: "1 rue", postalCode: "75001", city: "Paris", country: "France" },
      provider,
    );
    expect(out?.provider).toBe("mock");
    expect(out?.lat).toBe(48.8);
  });

  test("geocodes with postal code only (first query is CP + country)", async () => {
    const provider = {
      async geocode(query: string) {
        if (query === "80120, France") return { lat: 50.1, lng: 1.8, provider: "mock" };
        return null;
      },
    };
    const out = await geocodeNormalizedAddressWithFallbacks({ postalCode: "80120" }, provider);
    expect(out?.lat).toBe(50.1);
  });
});
