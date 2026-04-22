import type { ApifyRun, ApifyStartRunInput, ApifyDatasetItem } from "./types";

const APIFY_API_BASE = "https://api.apify.com/v2";

function getApifyToken(): string {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN manquant dans les variables d'environnement");
  }
  return token;
}

/**
 * Encode l'actor ID pour l'URL Apify.
 * Apify accepte le format "user~actor" dans les URLs (le "/" devient "~").
 */
function encodeActorId(actorId: string): string {
  return actorId.replace("/", "~");
}

/**
 * Lance un run sur un acteur Apify (mode async, ne bloque pas).
 * Le run s'exécute côté Apify ; on récupère les résultats plus tard via
 * getApifyRunStatus + listApifyDatasetItems.
 */
export async function startApifyActorRun(
  actorId: string,
  input: ApifyStartRunInput,
): Promise<ApifyRun> {
  const token = getApifyToken();
  const url = `${APIFY_API_BASE}/acts/${encodeActorId(actorId)}/runs`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify start run failed (${res.status}): ${text.slice(0, 500)}`);
  }

  const payload = (await res.json()) as { data: ApifyRun };
  return payload.data;
}

/** Récupère l'état actuel d'un run Apify. */
export async function getApifyRunStatus(runId: string): Promise<ApifyRun> {
  const token = getApifyToken();
  const url = `${APIFY_API_BASE}/actor-runs/${runId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify get run failed (${res.status}): ${text.slice(0, 500)}`);
  }

  const payload = (await res.json()) as { data: ApifyRun };
  return payload.data;
}

/**
 * Récupère les items d'un dataset Apify.
 * Par défaut, max 10k items par appel (limite Apify).
 * Pour plus, utiliser la pagination avec `offset`.
 */
export async function listApifyDatasetItems(
  datasetId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<ApifyDatasetItem[]> {
  const token = getApifyToken();
  const params = new URLSearchParams({
    clean: "true",
    format: "json",
  });
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));
  if (opts.offset !== undefined) params.set("offset", String(opts.offset));

  const url = `${APIFY_API_BASE}/datasets/${datasetId}/items?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify list dataset items failed (${res.status}): ${text.slice(0, 500)}`);
  }

  return (await res.json()) as ApifyDatasetItem[];
}

/** Abandonne un run en cours (utile pour stopper une exécution qui dépasse). */
export async function abortApifyRun(runId: string): Promise<void> {
  const token = getApifyToken();
  const url = `${APIFY_API_BASE}/actor-runs/${runId}/abort`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify abort run failed (${res.status}): ${text.slice(0, 500)}`);
  }
}
