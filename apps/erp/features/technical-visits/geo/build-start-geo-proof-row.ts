import { haversineDistanceMeters } from "@/lib/geo/haversine-distance-m";

import {
  START_GEO_NEAR_SITE_MAX_M,
  START_GEO_ON_SITE_MAX_M,
  type VisitStartGeoCoherence,
  type VisitStartGeoProviderErrorCode,
} from "./start-geo-constants";
import type { VisitStartGeoPayload } from "./visit-start-geo-payload";

function classifyDistance(distanceM: number): Exclude<
  VisitStartGeoCoherence,
  "site_coords_missing" | "geo_unavailable" | "geo_refused"
> {
  if (distanceM <= START_GEO_ON_SITE_MAX_M) return "on_site";
  if (distanceM <= START_GEO_NEAR_SITE_MAX_M) return "near_site";
  return "far_from_site";
}

function siteCoordsUsable(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/**
 * Construit la ligne `technical_visit_geo_proofs` + métadonnées UX (message court).
 * Tout calcul de distance / cohérence est fait ici (serveur).
 */
export function buildStartGeoProofInsert(
  technicalVisitId: string,
  worksiteLatitude: number | null | undefined,
  worksiteLongitude: number | null | undefined,
  payload: VisitStartGeoPayload,
): {
  row: {
    technical_visit_id: string;
    kind: "visit_start";
    latitude: number | null;
    longitude: number | null;
    accuracy_m: number | null;
    client_captured_at: string | null;
    provider_error_code: VisitStartGeoProviderErrorCode | null;
    distance_to_site_m: number | null;
    coherence: VisitStartGeoCoherence;
    worksite_latitude_snapshot: number | null;
    worksite_longitude_snapshot: number | null;
  };
  userMessageFr: string | null;
} {
  const snapLat = siteCoordsUsable(worksiteLatitude, worksiteLongitude) ? Number(worksiteLatitude) : null;
  const snapLng = siteCoordsUsable(worksiteLatitude, worksiteLongitude) ? Number(worksiteLongitude) : null;

  if (!payload.ok) {
    const coherence: VisitStartGeoCoherence =
      payload.code === "refused" ? "geo_refused" : "geo_unavailable";
    const messages: Record<VisitStartGeoProviderErrorCode, string> = {
      refused:
        "Visite démarrée. La localisation a été refusée — la preuve GPS n’a pas été enregistrée.",
      unavailable:
        "Visite démarrée. Localisation indisponible — la preuve GPS n’a pas été enregistrée.",
      timeout: "Visite démarrée. Délai de localisation dépassé — la preuve GPS n’a pas été enregistrée.",
      incompatible:
        "Visite démarrée. Navigateur incompatible — la preuve GPS n’a pas été enregistrée.",
    };
    return {
      row: {
        technical_visit_id: technicalVisitId,
        kind: "visit_start",
        latitude: null,
        longitude: null,
        accuracy_m: null,
        client_captured_at: null,
        provider_error_code: payload.code,
        distance_to_site_m: null,
        coherence,
        worksite_latitude_snapshot: snapLat,
        worksite_longitude_snapshot: snapLng,
      },
      userMessageFr: messages[payload.code],
    };
  }

  const { latitude, longitude, accuracyM, clientCapturedAtIso } = payload;

  if (!siteCoordsUsable(snapLat, snapLng)) {
    return {
      row: {
        technical_visit_id: technicalVisitId,
        kind: "visit_start",
        latitude,
        longitude,
        accuracy_m: accuracyM,
        client_captured_at: clientCapturedAtIso,
        provider_error_code: null,
        distance_to_site_m: null,
        coherence: "site_coords_missing",
        worksite_latitude_snapshot: snapLat,
        worksite_longitude_snapshot: snapLng,
      },
      userMessageFr:
        "Visite démarrée. Position enregistrée — le site n’a pas de coordonnées de référence pour comparaison.",
    };
  }

  const distanceM = haversineDistanceMeters(latitude, longitude, snapLat!, snapLng!);
  const coherence = classifyDistance(distanceM);

  let userMessageFr: string | null = null;
  if (coherence === "near_site") {
    userMessageFr =
      "Visite démarrée. Position enregistrée — vous semblez proche du site (vérifier si besoin).";
  } else if (coherence === "far_from_site") {
    userMessageFr =
      "Visite démarrée. Position enregistrée — écart important avec l’adresse chantier signalé.";
  }

  return {
    row: {
      technical_visit_id: technicalVisitId,
      kind: "visit_start",
      latitude,
      longitude,
      accuracy_m: accuracyM,
      client_captured_at: clientCapturedAtIso,
      provider_error_code: null,
      distance_to_site_m: Math.round(distanceM),
      coherence,
      worksite_latitude_snapshot: snapLat,
      worksite_longitude_snapshot: snapLng,
    },
    userMessageFr,
  };
}
