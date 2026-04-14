"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

import { TECHNICAL_VISIT_STATUS_LABELS } from "@/features/technical-visits/constants";
import { geocodeFranceAddress } from "@/features/technical-visits/lib/nominatim-geocode";
import { buildWorksiteGeocodeQuery } from "@/features/technical-visits/lib/worksite-geocode-query";
import type { TechnicalVisitListRow } from "@/features/technical-visits/types";
import type { TechnicalVisitStatus } from "@/types/database.types";

import "leaflet/dist/leaflet.css";

const FR_CENTER: LatLngExpression = [46.5, 2.5];
const DEFAULT_ZOOM = 6;

const STATUS_MARKER_COLORS: Record<TechnicalVisitStatus, string> = {
  to_schedule: "#6b7280",
  scheduled: "#2563eb",
  performed: "#0284c7",
  report_pending: "#ea580c",
  validated: "#16a34a",
  refused: "#dc2626",
  cancelled: "#94a3b8",
};

type GeocodeLatLng = { lat: number; lng: number };

function hasStoredCoords(v: TechnicalVisitListRow): boolean {
  return (
    v.worksite_latitude != null &&
    v.worksite_longitude != null &&
    Number.isFinite(Number(v.worksite_latitude)) &&
    Number.isFinite(Number(v.worksite_longitude))
  );
}

function jitterLatLng(
  id: string,
  base: GeocodeLatLng,
  index: number,
  total: number,
): GeocodeLatLng {
  if (total <= 1) return base;
  const angle = (index / total) * Math.PI * 2;
  const r = 0.0025;
  return {
    lat: base.lat + Math.cos(angle) * r,
    lng: base.lng + Math.sin(angle) * r,
  };
}

function assignPositionsWithJitter(
  items: { visit: TechnicalVisitListRow; base: GeocodeLatLng }[],
): { visit: TechnicalVisitListRow; position: [number, number] }[] {
  const byKey = new Map<string, { visit: TechnicalVisitListRow; base: GeocodeLatLng }[]>();
  for (const item of items) {
    const key = `${item.base.lat.toFixed(6)},${item.base.lng.toFixed(6)}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(item);
  }
  const out: { visit: TechnicalVisitListRow; position: [number, number] }[] = [];
  for (const group of byKey.values()) {
    group.forEach((item, idx) => {
      const j = jitterLatLng(item.visit.id, item.base, idx, group.length);
      out.push({ visit: item.visit, position: [j.lat, j.lng] });
    });
  }
  return out;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      map.setView(FR_CENTER, DEFAULT_ZOOM);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [map, points]);
  return null;
}

export type TechnicalVisitsMapProps = {
  visits: TechnicalVisitListRow[];
};

export function TechnicalVisitsMap({ visits }: TechnicalVisitsMapProps) {
  const [pins, setPins] = useState<
    {
      visit: TechnicalVisitListRow;
      position: [number, number];
    }[]
  >([]);
  const [skipped, setSkipped] = useState<TechnicalVisitListRow[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMapReady(false);
    setErrorMsg(null);

    async function run() {
      const storedBases: { visit: TechnicalVisitListRow; base: GeocodeLatLng }[] = [];
      for (const v of visits) {
        if (hasStoredCoords(v)) {
          storedBases.push({
            visit: v,
            base: { lat: Number(v.worksite_latitude), lng: Number(v.worksite_longitude) },
          });
        }
      }

      const toGeocode = visits.filter((v) => !hasStoredCoords(v) && buildWorksiteGeocodeQuery(v));

      if (toGeocode.length === 0) {
        setPins(assignPositionsWithJitter(storedBases));
        setSkipped(visits.filter((v) => !hasStoredCoords(v) && !buildWorksiteGeocodeQuery(v)));
        if (!cancelled) setMapReady(true);
        return;
      }

      const grouped = new Map<string, TechnicalVisitListRow[]>();
      for (const v of toGeocode) {
        const q = buildWorksiteGeocodeQuery(v);
        if (!q) continue;
        if (!grouped.has(q)) grouped.set(q, []);
        grouped.get(q)!.push(v);
      }

      const geocodedBases: { visit: TechnicalVisitListRow; base: GeocodeLatLng }[] = [];
      const failedVisits: TechnicalVisitListRow[] = [];
      const entries = [...grouped.entries()];
      const NOMINATIM_DELAY_MS = 1100;

      for (let i = 0; i < entries.length; i++) {
        if (cancelled) return;
        const [query, groupVisits] = entries[i];
        if (i > 0) {
          await new Promise((r) => setTimeout(r, NOMINATIM_DELAY_MS));
        }
        if (cancelled) return;

        const coords = await geocodeFranceAddress(query);
        if (!coords) {
          failedVisits.push(...groupVisits);
          continue;
        }

        groupVisits.forEach((visit) => {
          geocodedBases.push({ visit, base: coords });
        });
      }

      if (cancelled) return;

      const merged = [...storedBases, ...geocodedBases];
      setPins(assignPositionsWithJitter(merged));

      const noAddress = visits.filter((v) => !hasStoredCoords(v) && !buildWorksiteGeocodeQuery(v));
      setSkipped([...noAddress, ...failedVisits]);
      setMapReady(true);
    }

    void run().catch((e: unknown) => {
      if (!cancelled) {
        setErrorMsg(e instanceof Error ? e.message : "Erreur de géocodage.");
        setMapReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [visits]);

  const boundsPoints = useMemo(() => pins.map((p) => p.position), [pins]);

  if (visits.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {!mapReady ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Préparation de la carte…
        </p>
      ) : null}
      {errorMsg ? (
        <p className="text-sm text-destructive">{errorMsg}</p>
      ) : null}

      <div className="relative z-0 min-h-[min(70vh,560px)] w-full overflow-hidden rounded-xl border border-border bg-muted/20">
        <MapContainer
          center={FR_CENTER}
          zoom={DEFAULT_ZOOM}
          className="size-full min-h-[min(70vh,560px)]"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={boundsPoints} />
          {pins.map(({ visit, position }) => (
            <CircleMarker
              key={visit.id}
              center={position}
              radius={9}
              pathOptions={{
                color: "#fff",
                weight: 2,
                fillColor: STATUS_MARKER_COLORS[visit.status] ?? "#64748b",
                fillOpacity: 0.92,
              }}
            >
              <Popup>
                <div className="min-w-[200px] space-y-1 text-sm">
                  <p className="font-semibold">{visit.vt_reference}</p>
                  <p className="text-muted-foreground">{visit.lead_company_name ?? "—"}</p>
                  <p className="text-xs leading-snug">{buildWorksiteGeocodeQuery(visit) || "—"}</p>
                  <p>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {TECHNICAL_VISIT_STATUS_LABELS[visit.status]}
                    </span>
                  </p>
                  <Link
                    href={`/technical-visits/${visit.id}`}
                    className="inline-block text-primary underline-offset-4 hover:underline"
                  >
                    Ouvrir la fiche
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {skipped.length > 0 ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {skipped.length} visite{skipped.length > 1 ? "s" : ""} sans position sur la carte (adresse travaux
          incomplète ou introuvable). Enregistrez une adresse complète sur la fiche pour géolocaliser la visite.
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Les coordonnées enregistrées sur chaque fiche (lors de l’enregistrement) sont utilisées en priorité. Sinon,
        position indicative via{" "}
        <a
          href="https://nominatim.openstreetmap.org/"
          className="underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Nominatim
        </a>{" "}
        (OpenStreetMap).
      </p>
    </div>
  );
}
