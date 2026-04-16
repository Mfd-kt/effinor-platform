import { describe, expect, test } from "vitest";

import {
  getProfileLocationQuality,
  getVisitLocationQuality,
  hasCompleteAddress,
  hasEnoughForWorksiteGeocoding,
  isValidLatitude,
  isValidLongitude,
} from "@/features/technical-visits/lib/location-validation";

describe("location-validation", () => {
  test("validates latitude ranges", () => {
    expect(isValidLatitude(48.8)).toBe(true);
    expect(isValidLatitude(-90)).toBe(true);
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(90.1)).toBe(false);
    expect(isValidLatitude(null)).toBe(false);
    expect(isValidLatitude(undefined)).toBe(false);
    expect(isValidLatitude("48.8")).toBe(false);
  });

  test("validates longitude ranges", () => {
    expect(isValidLongitude(2.3)).toBe(true);
    expect(isValidLongitude(-180)).toBe(true);
    expect(isValidLongitude(180)).toBe(true);
    expect(isValidLongitude(180.1)).toBe(false);
    expect(isValidLongitude(null)).toBe(false);
    expect(isValidLongitude(undefined)).toBe(false);
    expect(isValidLongitude("2.3")).toBe(false);
  });

  test("checks complete address with trimmed values", () => {
    expect(
      hasCompleteAddress({
        address_line_1: " 1 Avenue de l'Europe ",
        postal_code: "94320",
        city: "  Thiais ",
        country: " France ",
      }),
    ).toBe(true);
    expect(
      hasCompleteAddress({
        address_line_1: "",
        postal_code: "94320",
        city: "Thiais",
        country: "France",
      }),
    ).toBe(false);
  });

  test("computes profile quality statuses", () => {
    expect(
      getProfileLocationQuality({
        address_line_1: "1 rue",
        postal_code: "75001",
        city: "Paris",
        country: "France",
        latitude: 48.86,
        longitude: 2.34,
      }),
    ).toBe("complete_geocoded");
    expect(
      getProfileLocationQuality({
        address_line_1: "1 rue",
        postal_code: "75001",
        city: "Paris",
        country: "France",
      }),
    ).toBe("complete_not_geocoded");
    expect(getProfileLocationQuality({ address_line_1: "1 rue" })).toBe("incomplete_address");
    expect(
      getProfileLocationQuality({
        address_line_1: "1 rue",
        postal_code: "75001",
        city: "Paris",
        country: "France",
        latitude: 200,
        longitude: 2.34,
      }),
    ).toBe("invalid_coordinates");
  });

  test("computes visit quality statuses", () => {
    expect(
      getVisitLocationQuality({
        worksite_address: "2 rue",
        worksite_postal_code: "75002",
        worksite_city: "Paris",
        worksite_country: "France",
      }),
    ).toBe("complete_not_geocoded");
    expect(
      getVisitLocationQuality({
        worksite_address: "2 rue",
        worksite_postal_code: "75002",
        worksite_city: "Paris",
        worksite_country: "France",
        worksite_latitude: 48.8,
        worksite_longitude: 2.3,
      }),
    ).toBe("complete_geocoded");

    expect(
      getVisitLocationQuality({
        worksite_address: null,
        worksite_postal_code: null,
        worksite_city: null,
        worksite_country: null,
        worksite_latitude: 50.266837,
        worksite_longitude: 1.666383,
      }),
    ).toBe("complete_geocoded");

    expect(
      getVisitLocationQuality({
        worksite_address: null,
        worksite_postal_code: "80120",
        worksite_city: null,
        worksite_country: null,
      }),
    ).toBe("complete_not_geocoded");
  });
});
