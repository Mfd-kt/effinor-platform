import type { DropcontactEnrichmentPostBody } from "./build-dropcontact-request";
import type { DropcontactPostResponse } from "./types";

const POST_URL = "https://api.dropcontact.com/v1/enrich/all";

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
