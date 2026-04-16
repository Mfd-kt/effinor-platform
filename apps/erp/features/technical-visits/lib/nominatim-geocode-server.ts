/**
 * Géocodage Nominatim côté serveur uniquement (Node fetch, pas de CORS).
 * @see https://operations.osmfoundation.org/policies/nominatim/
 */

const USER_AGENT = "EffinorERP/1.0 (support@effinor.fr)";

export type GeocodeLatLng = { lat: number; lng: number };

type NominatimHit = { lat: string; lon: string };
type AdresseApiFeature = {
  geometry?: { coordinates?: [number, number] };
};
type GoogleGeocodingResponse = {
  status?: string;
  results?: Array<{
    geometry?: {
      location?: { lat?: number; lng?: number };
    };
  }>;
};

function parseFiniteLatLng(latRaw: unknown, lngRaw: unknown): GeocodeLatLng | null {
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function geocodeWithNominatim(query: string): Promise<GeocodeLatLng | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "fr");
  url.searchParams.set("q", query);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "fr",
      "User-Agent": USER_AGENT,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = (await res.json()) as NominatimHit[];
  const first = data[0];
  if (!first?.lat || !first?.lon) return null;
  return parseFiniteLatLng(first.lat, first.lon);
}

async function geocodeWithAdresseApi(query: string): Promise<GeocodeLatLng | null> {
  const url = new URL("https://api-adresse.data.gouv.fr/search/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { features?: AdresseApiFeature[] };
  const first = data.features?.[0];
  const coords = first?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  // API adresse renvoie [lon, lat].
  return parseFiniteLatLng(coords[1], coords[0]);
}

async function geocodeWithGoogleMaps(query: string): Promise<GeocodeLatLng | null> {
  const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY?.trim();
  if (!apiKey) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("region", "fr");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as GoogleGeocodingResponse;
  if (data.status !== "OK") return null;
  const location = data.results?.[0]?.geometry?.location;
  if (!location) return null;
  return parseFiniteLatLng(location.lat, location.lng);
}

export async function geocodeFranceAddressServer(query: string): Promise<GeocodeLatLng | null> {
  const q = query.trim();
  if (!q) return null;
  // Chaîne de fallback: OSM -> API Adresse FR -> Google Maps (si clé présente).
  const fromNominatim = await geocodeWithNominatim(q);
  if (fromNominatim) return fromNominatim;
  const fromAdresseApi = await geocodeWithAdresseApi(q);
  if (fromAdresseApi) return fromAdresseApi;
  return geocodeWithGoogleMaps(q);
}
