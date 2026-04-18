import type { FirecrawlScrapeResponse } from "./types";

const FIRECRAWL_SEARCH_V1 = "https://api.firecrawl.dev/v1/search";

export type FirecrawlWebSearchHit = {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
};

function getApiKey(): string {
  const k = process.env.FIRECRAWL_API_KEY?.trim();
  if (!k) {
    throw new Error("Variable FIRECRAWL_API_KEY manquante : configurez la clé API Firecrawl côté serveur.");
  }
  return k;
}

function normalizeHits(raw: unknown): FirecrawlWebSearchHit[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  const data = o.data;
  const list: unknown[] = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).web)
      ? ((data as Record<string, unknown>).web as unknown[])
      : data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).results)
        ? ((data as Record<string, unknown>).results as unknown[])
        : [];
  const out: FirecrawlWebSearchHit[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const h = item as Record<string, unknown>;
    const url = typeof h.url === "string" ? h.url : typeof h.link === "string" ? h.link : "";
    if (!url) continue;
    const title = typeof h.title === "string" ? h.title : undefined;
    const description = typeof h.description === "string" ? h.description : typeof h.snippet === "string" ? h.snippet : undefined;
    const markdown = typeof h.markdown === "string" ? h.markdown : undefined;
    out.push({ url, title, description, markdown });
  }
  return out;
}

/**
 * Recherche web via Firecrawl (v1). Résultats réels (titres / extraits), sans génération.
 */
export async function searchFirecrawlWeb(input: {
  query: string;
  limit?: number;
  /** Si true, demande du markdown par résultat (plus coûteux). */
  scrapeMarkdown?: boolean;
}): Promise<FirecrawlWebSearchHit[]> {
  const apiKey = getApiKey();
  const limit = Math.min(10, Math.max(1, input.limit ?? 5));
  const body: Record<string, unknown> = {
    query: input.query.slice(0, 500),
    limit,
  };
  if (input.scrapeMarkdown) {
    body.scrapeOptions = { formats: ["markdown"] };
  }

  const res = await fetch(FIRECRAWL_SEARCH_V1, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: FirecrawlScrapeResponse & { data?: unknown };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(`Firecrawl search : réponse non JSON (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    const msg = json.error || text.slice(0, 200) || res.statusText;
    if (res.status === 401 || res.status === 403) {
      throw new Error("Firecrawl : clé API refusée ou expirée.");
    }
    if (res.status === 402) {
      throw new Error("Firecrawl : crédits ou abonnement insuffisants.");
    }
    if (res.status === 429) {
      throw new Error("Firecrawl : trop de requêtes, réessayez plus tard.");
    }
    throw new Error(`Firecrawl search : erreur HTTP ${res.status} — ${msg}`);
  }

  if (json.success === false) {
    throw new Error(json.error || "Firecrawl : échec de la recherche.");
  }

  return normalizeHits(json);
}
