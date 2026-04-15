"use client";

import type { VisitStartGeoPayloadInput } from "./visit-start-geo-payload";

const TIMEOUT_MS = 18_000;

function positionToPayload(position: GeolocationPosition): VisitStartGeoPayloadInput {
  return {
    ok: true,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyM: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
    clientCapturedAtIso: new Date(position.timestamp ? position.timestamp : Date.now()).toISOString(),
  };
}

function mapErrorCode(code: number): VisitStartGeoPayloadInput {
  if (code === 1) {
    return { ok: false, code: "refused" };
  }
  if (code === 3) {
    return { ok: false, code: "timeout" };
  }
  return { ok: false, code: "unavailable" };
}

/**
 * Tente la géolocalisation navigateur pour la preuve de démarrage.
 * Ne lance pas : retourne toujours un payload sérialisable pour l’action serveur.
 */
export function requestBrowserGeolocationForVisitStart(): Promise<VisitStartGeoPayloadInput> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, code: "incompatible" });
  }

  return new Promise((resolve) => {
    let settled = false;
    const done = (payload: VisitStartGeoPayloadInput) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(payload);
    };

    const timer = window.setTimeout(() => {
      done({ ok: false, code: "timeout" });
    }, TIMEOUT_MS);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        done(positionToPayload(pos));
      },
      (err) => {
        done(mapErrorCode(err.code));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: TIMEOUT_MS - 500,
      },
    );
  });
}
