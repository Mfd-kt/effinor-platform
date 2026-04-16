import type { GeocodingProvider } from "@/features/technical-visits/lib/geocoding-provider";
import { defaultGeocodingProvider } from "@/features/technical-visits/lib/geocoding-provider";
import { buildAddressFallbackQueries } from "@/features/technical-visits/lib/address-normalization";
import { hasEnoughForWorksiteGeocoding } from "@/features/technical-visits/lib/location-validation";

const RETRY_COOLDOWN_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function shouldSkipGeocodingAttempt(input: {
  geocoding_status?: string | null;
  geocoding_updated_at?: string | null;
  geocoding_attempts?: number | null;
  hasCoords: boolean;
}): boolean {
  if (input.hasCoords) return true;
  const attempts = input.geocoding_attempts ?? 0;
  if (attempts >= MAX_ATTEMPTS) return true;
  if (input.geocoding_status !== "geocoding_error") return false;
  const updatedAtMs = input.geocoding_updated_at ? new Date(input.geocoding_updated_at).getTime() : 0;
  if (!Number.isFinite(updatedAtMs) || updatedAtMs <= 0) return false;
  return Date.now() - updatedAtMs < RETRY_COOLDOWN_MS;
}

export async function geocodeNormalizedAddressWithFallbacks(
  input: {
    addressLine1?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
  },
  provider: GeocodingProvider = defaultGeocodingProvider,
): Promise<{ lat: number; lng: number; provider: string } | null> {
  const queries = buildAddressFallbackQueries(input);
  for (const q of queries) {
    const out = await provider.geocode(q);
    if (out) return out;
  }
  return null;
}

export function nextGeocodingStatusFromAddress(input: {
  addressLine1?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
}): "incomplete_address" | "complete_not_geocoded" {
  return hasEnoughForWorksiteGeocoding({
    address_line_1: input.addressLine1,
    postal_code: input.postalCode,
    city: input.city,
    country: input.country,
  })
    ? "complete_not_geocoded"
    : "incomplete_address";
}
