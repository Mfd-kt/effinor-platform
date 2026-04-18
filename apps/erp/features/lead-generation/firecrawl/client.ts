import type { FirecrawlScrapeResponse } from "./types";

const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v1/scrape";

function getApiKey(): string {
  const k = process.env.FIRECRAWL_API_KEY?.trim();
  if (!k) {
    throw new Error("Variable FIRECRAWL_API_KEY manquante : configurez la clé API Firecrawl côté serveur.");
  }
  return k;
}

/**
 * Scrape une URL via Firecrawl (markdown pour extraction locale, sans schéma LLM coûteux).
 */
export async function scrapeFirecrawlUrl(input: { url: string; timeoutMs?: number }): Promise<FirecrawlScrapeResponse> {
  const apiKey = getApiKey();
  const timeoutMs = input.timeoutMs ?? 45_000;

  const res = await fetch(FIRECRAWL_SCRAPE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: input.url,
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: timeoutMs,
    }),
  });

  const text = await res.text();
  let json: FirecrawlScrapeResponse;
  try {
    json = JSON.parse(text) as FirecrawlScrapeResponse;
  } catch {
    throw new Error(`Firecrawl : réponse non JSON (HTTP ${res.status}).`);
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
    throw new Error(`Firecrawl : erreur HTTP ${res.status} — ${msg}`);
  }

  if (json.success === false) {
    throw new Error(json.error || "Firecrawl : échec du scrape.");
  }

  return json;
}
