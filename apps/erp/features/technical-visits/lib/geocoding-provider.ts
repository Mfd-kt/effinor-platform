import { geocodeFranceAddressServer } from "@/features/technical-visits/lib/nominatim-geocode-server";

export type GeocodingResult = {
  lat: number;
  lng: number;
  provider: string;
};

export interface GeocodingProvider {
  geocode(address: string): Promise<GeocodingResult | null>;
}

export const defaultGeocodingProvider: GeocodingProvider = {
  async geocode(address: string): Promise<GeocodingResult | null> {
    const c = await geocodeFranceAddressServer(address);
    if (!c) return null;
    return { lat: c.lat, lng: c.lng, provider: "nominatim_chain" };
  },
};
