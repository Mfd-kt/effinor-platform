type GeoQualityLevel = "very_clean" | "correct" | "medium" | "high_noise" | "national";

export type LeadGenerationImportGeoQuality = {
  target: string;
  targetingType: "france_wide" | "precise_department_or_territory";
  acceptedCount: number;
  rejectedOutOfScopeCount: number;
  conformityRatePercent: number | null;
  level: GeoQualityLevel;
  hasDetailedGeoData: boolean;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  return 0;
}

function isFranceWideTarget(target: string): boolean {
  const normalized = target.trim().toLowerCase();
  return normalized === "france" || normalized === "france metropolitaine" || normalized === "france métropolitaine";
}

function levelForRate(rate: number | null, franceWide: boolean): GeoQualityLevel {
  if (franceWide) return "national";
  if (rate === null) return "medium";
  if (rate >= 90) return "very_clean";
  if (rate >= 70) return "correct";
  if (rate >= 40) return "medium";
  return "high_noise";
}

export function readLeadGenerationImportGeoQuality(input: {
  source: string;
  metadataJson: unknown;
  acceptedCount: number | null | undefined;
}): LeadGenerationImportGeoQuality | null {
  if (input.source !== "apify_google_maps") {
    return null;
  }

  const metadata = asObject(input.metadataJson) ?? {};
  const geoScopeFilter = asObject(metadata.geo_scope_filter);

  const metadataLocationQuery =
    typeof metadata.locationQuery === "string" && metadata.locationQuery.trim().length > 0
      ? metadata.locationQuery.trim()
      : "";
  const metadataGeoTarget =
    typeof geoScopeFilter?.target === "string" && geoScopeFilter.target.trim().length > 0
      ? geoScopeFilter.target.trim()
      : "";

  const target = metadataGeoTarget || metadataLocationQuery || "France";
  const acceptedCount = asSafeNumber(input.acceptedCount);
  const rejectedOutOfScopeCount = asSafeNumber(geoScopeFilter?.rejected_out_of_scope_count);
  const denominator = acceptedCount + rejectedOutOfScopeCount;
  const conformityRatePercent = denominator > 0 ? Math.round((acceptedCount / denominator) * 1000) / 10 : null;
  const franceWide = isFranceWideTarget(target);

  return {
    target,
    targetingType: franceWide ? "france_wide" : "precise_department_or_territory",
    acceptedCount,
    rejectedOutOfScopeCount,
    conformityRatePercent,
    level: levelForRate(conformityRatePercent, franceWide),
    hasDetailedGeoData: Boolean(geoScopeFilter),
  };
}

