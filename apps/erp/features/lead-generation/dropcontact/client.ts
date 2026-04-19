import type { DropcontactEnrichmentPostBody } from "./build-dropcontact-request";
import type { DropcontactGetResponse, DropcontactPostResponse } from "./types";

const POST_URL = "https://api.dropcontact.com/v1/enrich/all";

export type FetchDropcontactEnrichmentOutcome =
  | { kind: "not_ready"; reason?: string }
  | { kind: "ready"; contacts: Record<string, unknown>[] }
  | { kind: "failed"; message: string };

export function getDropcontactApiKey(): string | null {
  const k = process.env.DROPCONTACT_API_KEY?.trim() || process.env.DROPCONTACT_ACCESS_TOKEN?.trim();
  return k && k.length > 0 ? k : null;
}

export async function sendDropcontactEnrichmentRequest(
  payload: DropcontactEnrichmentPostBody,
): Promise<{ ok: true; request_id: string } | { ok: false; message: string }> {
  const token = getDropcontactApiKey();
  if (!token) {
    return { ok: false, message: "Configuration serveur incomplète pour l’enrichissement." };
  }

  const res = await fetch(POST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": token,
    },
    body: JSON.stringify(payload),
  });

  let json: DropcontactPostResponse;
  try {
    json = (await res.json()) as DropcontactPostResponse;
  } catch {
    return { ok: false, message: "L’enrichissement n’a pas pu démarrer." };
  }
  if (!res.ok || json.error || !json.success || !json.request_id) {
    return { ok: false, message: "L’enrichissement n’a pas pu démarrer." };
  }
  return { ok: true, request_id: json.request_id };
}

/**
 * Récupère le résultat d’un POST /v1/enrich/all (alternative au webhook).
 * @see https://developer.dropcontact.com/
 */
export async function fetchDropcontactEnrichmentResult(
  requestId: string,
): Promise<FetchDropcontactEnrichmentOutcome> {
  const rid = requestId?.trim();
  if (!rid) {
    return { kind: "failed", message: "Identifiant de requête Dropcontact manquant." };
  }

  const token = getDropcontactApiKey();
  if (!token) {
    return { kind: "failed", message: "Configuration serveur incomplète pour l’enrichissement." };
  }

  const url = `https://api.dropcontact.com/v1/enrich/all/${encodeURIComponent(rid)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "X-Access-Token": token },
  });

  let json: DropcontactGetResponse;
  try {
    json = (await res.json()) as DropcontactGetResponse;
  } catch {
    return { kind: "failed", message: "Lecture du résultat Dropcontact impossible." };
  }

  if (!res.ok || json.error) {
    return { kind: "failed", message: "Lecture du résultat Dropcontact impossible." };
  }

  if (json.success === false) {
    return { kind: "not_ready", reason: typeof json.reason === "string" ? json.reason : undefined };
  }

  if (json.success === true) {
    const data = json.data;
    if (!Array.isArray(data)) {
      return { kind: "failed", message: "Réponse Dropcontact inattendue." };
    }
    return { kind: "ready", contacts: data as Record<string, unknown>[] };
  }

  return { kind: "failed", message: "Réponse Dropcontact inattendue." };
}
