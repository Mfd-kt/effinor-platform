/**
 * Géocodage via Nominatim (OSM). Usage : max ~1 requête / s ; cache côté appelant.
 * @see https://operations.osmfoundation.org/policies/nominatim/
 */

const USER_AGENT = "EffinorERP/1.0 (support@effinor.fr)";

export type GeocodeLatLng = { lat: number; lng: number };

type NominatimHit = { lat: string; lon: string };

export async function geocodeFranceAddress(query: string): Promise<GeocodeLatLng | null> {
  const q = query.trim();
  if (!q) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "fr");
  url.searchParams.set("q", q);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "fr",
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as NominatimHit[];
  const first = data[0];
  if (!first?.lat || !first?.lon) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}
