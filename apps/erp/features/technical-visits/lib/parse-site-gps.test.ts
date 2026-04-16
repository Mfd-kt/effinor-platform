import { describe, expect, test } from "vitest";

import { parseSiteGpsString } from "@/features/technical-visits/lib/parse-site-gps";

describe("parseSiteGpsString", () => {
  test("parses lat, lng with space", () => {
    expect(parseSiteGpsString("50.266837, 1.666383")).toEqual({ lat: 50.266837, lng: 1.666383 });
  });

  test("parses without space", () => {
    expect(parseSiteGpsString("50.266837,1.666383")).toEqual({ lat: 50.266837, lng: 1.666383 });
  });

  test("rejects invalid", () => {
    expect(parseSiteGpsString("")).toBeNull();
    expect(parseSiteGpsString("only one")).toBeNull();
    expect(parseSiteGpsString("200, 1")).toBeNull();
  });
});
