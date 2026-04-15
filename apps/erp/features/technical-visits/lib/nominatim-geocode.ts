/**
 * Géocodage pour le navigateur : passe par la route API interne (pas d’appel direct à Nominatim).
 * Côté serveur, utiliser {@link geocodeFranceAddressServer} depuis `nominatim-geocode-server.ts`.
 */

export type GeocodeLatLng = { lat: number; lng: number };

export async function geocodeFranceAddress(query: string): Promise<GeocodeLatLng | null> {
  const q = query.trim();
  if (!q) return null;

  try {
    const path = `/api/geocode/fr?${new URLSearchParams({ q })}`;
    const res = await fetch(path, { credentials: "same-origin" });
    if (res.status === 401) {
      return null;
    }
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as GeocodeLatLng | Record<string, unknown> | null;
    if (data == null || typeof data !== "object" || !("lat" in data) || !("lng" in data)) {
      return null;
    }
    const lat = Number((data as GeocodeLatLng).lat);
    const lng = Number((data as GeocodeLatLng).lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
