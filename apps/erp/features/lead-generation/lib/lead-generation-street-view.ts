import type { Json } from "../domain/json";
import type { LeadGenerationStockRow } from "../domain/stock-row";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = v.trim().replace(",", ".");
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Extrait lat/lng depuis le payload brut Apify Google Maps (ou variantes).
 */
export function extractLatLngFromLeadGenerationRawPayload(rawPayload: Json | null | undefined): {
  lat: number;
  lng: number;
} | null {
  if (!isRecord(rawPayload)) {
    return null;
  }

  const item =
    rawPayload.apify_google_maps_item ??
    (isRecord(rawPayload.extra_payload) ? rawPayload.extra_payload.apify_google_maps_item : undefined);

  if (!isRecord(item)) {
    return null;
  }

  const loc = item.location;
  if (isRecord(loc)) {
    const lat = toNum(loc.lat ?? loc.latitude);
    const lng = toNum(loc.lng ?? loc.lon ?? loc.longitude);
    if (lat != null && lng != null) {
      return { lat, lng };
    }
  }

  const gps = item.gpsCoordinates ?? item.gps_coordinates;
  if (isRecord(gps)) {
    const lat = toNum(gps.latitude ?? gps.lat);
    const lng = toNum(gps.longitude ?? gps.lng);
    if (lat != null && lng != null) {
      return { lat, lng };
    }
  }

  const lat = toNum(item.latitude ?? item.lat);
  const lng = toNum(item.longitude ?? item.lng);
  if (lat != null && lng != null) {
    return { lat, lng };
  }

  return null;
}

function buildPostalAddress(stock: LeadGenerationStockRow): string {
  const parts = [stock.address, stock.postal_code, stock.city].filter((p) => (p ?? "").trim().length > 0) as string[];
  return parts.join(", ").trim();
}

export type LeadGenerationStreetViewModel = {
  canShowSection: boolean;
  embedSrc: string | null;
  openMapsUrl: string;
};

/**
 * Prépare iframe + liens pour une section Street View sur une fiche stock.
 */
export function buildLeadGenerationStreetViewModel(stock: LeadGenerationStockRow): LeadGenerationStreetViewModel {
  const coords = extractLatLngFromLeadGenerationRawPayload(stock.raw_payload);
  const postal = buildPostalAddress(stock);
  const canShowSection = Boolean(coords || postal.length > 0);

  let openMapsUrl = "https://www.google.com/maps";
  if (coords) {
    openMapsUrl = `https://www.google.com/maps?layer=c&cbll=${coords.lat},${coords.lng}`;
  } else if (postal) {
    const q = encodeURIComponent(`${stock.company_name.trim()}, ${postal}`);
    openMapsUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim();
  let embedSrc: string | null = null;
  if (key) {
    const locationParam = coords ? `${coords.lat},${coords.lng}` : postal;
    if (locationParam) {
      embedSrc = `https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(key)}&location=${encodeURIComponent(locationParam)}`;
    }
  }

  return {
    canShowSection,
    embedSrc,
    openMapsUrl,
  };
}
