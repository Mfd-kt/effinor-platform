"use client";

import { useCallback, useRef } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { detectZone } from "@/features/simulator-cee/domain/eligibility-rules";
import type { SimulationAddress } from "@/features/simulator-cee/domain/types";

const libraries = ["places"] as "places"[];

function parsePlaceResult(place: google.maps.places.PlaceResult): Partial<SimulationAddress> {
  const comps = place.address_components ?? [];
  const get = (type: string) => comps.find((c) => c.types.includes(type))?.long_name ?? "";

  const streetNumber = get("street_number");
  const route = get("route");
  const locality = get("locality") || get("postal_town");
  const postal = get("postal_code");

  const line = [streetNumber, route].filter(Boolean).join(" ").trim();

  return {
    adresse: line || place.formatted_address?.split(",")[0]?.trim() || "",
    codePostal: postal,
    ville: locality,
    latitude: place.geometry?.location?.lat(),
    longitude: place.geometry?.location?.lng(),
  };
}

export function AddressInput({
  value,
  onChange,
}: {
  value: SimulationAddress;
  onChange: (next: SimulationAddress) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "simulator-cee-google-maps",
    googleMapsApiKey: apiKey,
    libraries,
  });

  const handlePlaceChanged = useCallback(() => {
    const ac = acRef.current;
    if (!ac) return;
    const place = ac.getPlace();
    if (!place?.address_components?.length && !place.formatted_address) return;
    const parsed = parsePlaceResult(place);
    onChange({
      ...value,
      ...parsed,
      adresse: parsed.adresse || value.adresse,
      codePostal: (parsed.codePostal || value.codePostal).replace(/\D/g, "").slice(0, 5),
      ville: parsed.ville || value.ville,
    });
  }, [onChange, value]);

  const zoneHint = detectZone(value.codePostal);

  const showMaps = Boolean(apiKey) && isLoaded && !loadError;

  return (
    <div className="space-y-4">
      {!apiKey ? (
        <p className="text-sm text-amber-800">
          Clé <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> absente
          : saisie manuelle uniquement.
        </p>
      ) : null}
      {loadError ? (
        <p className="text-sm text-red-600">Impossible de charger Google Places. Saisie manuelle.</p>
      ) : null}

      {showMaps ? (
        <div className="space-y-2">
          <Label htmlFor="addr-search">Rechercher une adresse</Label>
          <Autocomplete onLoad={(ac) => (acRef.current = ac)} onPlaceChanged={handlePlaceChanged}>
            <Input
              id="addr-search"
              placeholder="Tapez une adresse (autocomplétion)"
              className="rounded-xl border-violet-200 bg-white"
            />
          </Autocomplete>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="addr-line">Adresse</Label>
        <Input
          id="addr-line"
          value={value.adresse}
          onChange={(e) => onChange({ ...value, adresse: e.target.value })}
          className="rounded-xl border-violet-200 bg-white"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="addr-cp">Code postal</Label>
          <Input
            id="addr-cp"
            inputMode="numeric"
            maxLength={5}
            value={value.codePostal}
            onChange={(e) => onChange({ ...value, codePostal: e.target.value.replace(/\D/g, "").slice(0, 5) })}
            className="rounded-xl border-violet-200 bg-white"
          />
          {value.codePostal.length === 5 ? (
            <p className="text-xs text-slate-600">
              Zone détectée :{" "}
              <span className="font-medium text-violet-800">
                {zoneHint === "idf"
                  ? "Île-de-France"
                  : zoneHint === "hors_idf"
                    ? "Hors Île-de-France"
                    : "Indéterminée"}
              </span>
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="addr-city">Ville</Label>
          <Input
            id="addr-city"
            value={value.ville}
            onChange={(e) => onChange({ ...value, ville: e.target.value })}
            className="rounded-xl border-violet-200 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
