import type { DropcontactEnrichmentPostBody } from "./build-dropcontact-request";
import { logDropcontact } from "./dropcontact-log";
import type { DropcontactGetResponse, DropcontactPostResponse } from "./types";

const POST_URL = "https://api.dropcontact.com/v1/enrich/all";

export type FetchDropcontactEnrichmentOutcome =
  | { kind: "not_ready"; reason?: string }
  | { kind: "ready"; contacts: Record<string, unknown>[] }
  | { kind: "failed"; message: string; code: string; httpStatus?: number };

export type SendDropcontactEnrichmentResult =
  | { ok: true; request_id: string }
  | { ok: false; message: string; code: string; httpStatus?: number };

export function getDropcontactApiKey(): string | null {
  const k = process.env.DROPCONTACT_API_KEY?.trim() || process.env.DROPCONTACT_ACCESS_TOKEN?.trim();
  return k && k.length > 0 ? k : null;
}

export async function sendDropcontactEnrichmentRequest(
  payload: DropcontactEnrichmentPostBody,
): Promise<SendDropcontactEnrichmentResult> {
  const token = getDropcontactApiKey();
  if (!token) {
    logDropcontact("client_post", "Clé API absente (DROPCONTACT_API_KEY / DROPCONTACT_ACCESS_TOKEN)");
    return { ok: false, message: "Configuration serveur incomplète pour l’enrichissement.", code: "NO_API_KEY" };
  }

  const res = await fetch(POST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": token,
    },
    body: JSON.stringify(payload),
  });

  logDropcontact("client_post", "Réponse HTTP Dropcontact POST", { httpStatus: res.status, httpOk: res.ok });

  let json: DropcontactPostResponse;
  try {
    json = (await res.json()) as DropcontactPostResponse;
  } catch (e) {
    logDropcontact("client_post", "Corps POST non JSON", { error: String(e) });
    return {
      ok: false,
      message: "POST Dropcontact : réponse illisible (JSON).",
      code: "POST_JSON_PARSE",
      httpStatus: res.status,
    };
  }

  if (!res.ok) {
    logDropcontact("client_post", "POST_HTTP_ERROR", {
      httpStatus: res.status,
      apiError: json.error,
      apiSuccess: json.success,
    });
    return {
      ok: false,
      message: `POST Dropcontact HTTP ${res.status} (échec transport ou API).`,
      code: "POST_HTTP_ERROR",
      httpStatus: res.status,
    };
  }

  if (json.error || !json.success) {
    logDropcontact("client_post", "POST_API_NOT_SUCCESS", { error: json.error, success: json.success });
    return {
      ok: false,
      message: "POST Dropcontact refusé (success=false ou error côté API).",
      code: "POST_API_NOT_SUCCESS",
      httpStatus: res.status,
    };
  }

  const rid = json.request_id != null ? String(json.request_id).trim() : "";
  if (!rid) {
    logDropcontact("client_post", "POST_DROPCONTACT_SANS_REQUEST_ID", { success: json.success });
    return {
      ok: false,
      message: "POST Dropcontact sans request_id (réponse API incomplète).",
      code: "POST_DROPCONTACT_SANS_REQUEST_ID",
      httpStatus: res.status,
    };
  }

  logDropcontact("client_post", "POST Dropcontact OK", { requestId: rid });
  return { ok: true, request_id: rid };
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
    logDropcontact("client_get", "request_id vide");
    return { kind: "failed", message: "Identifiant de requête Dropcontact manquant.", code: "GET_NO_REQUEST_ID" };
  }

  const token = getDropcontactApiKey();
  if (!token) {
    logDropcontact("client_get", "Clé API absente");
    return { kind: "failed", message: "Configuration serveur incomplète pour l’enrichissement.", code: "GET_NO_API_KEY" };
  }

  const url = `https://api.dropcontact.com/v1/enrich/all/${encodeURIComponent(rid)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "X-Access-Token": token },
  });

  logDropcontact("client_get", "Réponse HTTP Dropcontact GET", { requestId: rid, httpStatus: res.status, httpOk: res.ok });

  let json: DropcontactGetResponse;
  try {
    json = (await res.json()) as DropcontactGetResponse;
  } catch (e) {
    logDropcontact("client_get", "Corps GET non JSON", { requestId: rid, error: String(e) });
    return {
      kind: "failed",
      message: "GET Dropcontact : réponse illisible (JSON).",
      code: "GET_JSON_PARSE",
      httpStatus: res.status,
    };
  }

  if (!res.ok || json.error) {
    logDropcontact("client_get", "GET_HTTP_OR_ERROR_FLAG", {
      requestId: rid,
      httpStatus: res.status,
      apiError: json.error,
    });
    return {
      kind: "failed",
      message: `GET Dropcontact HTTP ${res.status} ou error=true.`,
      code: "GET_HTTP_ERROR",
      httpStatus: res.status,
    };
  }

  if (json.success === false) {
    logDropcontact("client_get", "GET not_ready", { requestId: rid, reason: json.reason });
    return { kind: "not_ready", reason: typeof json.reason === "string" ? json.reason : undefined };
  }

  if (json.success === true) {
    const data = json.data;
    if (!Array.isArray(data)) {
      logDropcontact("client_get", "GET forme data inattendue", { requestId: rid });
      return {
        kind: "failed",
        message: "GET Dropcontact : champ data absent ou non tableau.",
        code: "GET_UNEXPECTED_SHAPE",
        httpStatus: res.status,
      };
    }
    logDropcontact("client_get", "GET Dropcontact OK", { requestId: rid, itemCount: data.length });
    return { kind: "ready", contacts: data as Record<string, unknown>[] };
  }

  logDropcontact("client_get", "GET réponse ambiguë", { requestId: rid, success: json.success });
  return {
    kind: "failed",
    message: "GET Dropcontact : réponse inattendue (success indéfini).",
    code: "GET_AMBIGUOUS",
    httpStatus: res.status,
  };
}
