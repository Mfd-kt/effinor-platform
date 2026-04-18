import type { ApifyActorRunData, ApifyEnvelope } from "./types";

const APIFY_API_BASE = "https://api.apify.com/v2";

export function getApifyToken(): string {
  const token = process.env.APIFY_API_TOKEN?.trim();
  if (!token) {
    throw new Error("Variable d’environnement APIFY_API_TOKEN manquante.");
  }
  return token;
}

export function getGoogleMapsActorId(): string {
  const actorId = process.env.APIFY_GOOGLE_MAPS_ACTOR_ID?.trim();
  if (!actorId) {
    throw new Error("Variable d’environnement APIFY_GOOGLE_MAPS_ACTOR_ID manquante.");
  }
  return actorId;
}

/** Actor Pages Jaunes (optionnel — run multi-source sans ce canal si absent). */
export function getYellowPagesActorId(): string | null {
  const actorId = process.env.APIFY_YELLOW_PAGES_ACTOR_ID?.trim();
  return actorId || null;
}

/**
 * Profil d’input Pages Jaunes :
 * - `google_maps_compat` : searchStringsArray + locationQuery (actors type Compass / annuaire générique).
 * - `trudax_us` : search + location + maxItems (yellowpages.com US).
 * - `pagesjaunes_fr` : startUrls (recherche pagesjaunes.fr) + maxItems + proxyConfiguration (ex. memo23/pagesjaunes-scraper-cheerio).
 * Surcharge : APIFY_YELLOW_PAGES_INPUT_PROFILE.
 */
export type YellowPagesApifyInputProfile = "google_maps_compat" | "trudax_us" | "pagesjaunes_fr";

/** IDs store Apify connus pour des actors « Yellow Pages US » (search / location / maxItems) — pas une source FR principale. */
const TRUDAX_STYLE_YELLOW_PAGES_ACTOR_IDS = new Set([
  "wwqrtazdtghcgtfvw", // ex. actor store US (tests)
]);

/** IDs store / slugs connus pour scrapers PagesJaunes.fr (startUrls + proxy résidentiel). */
const PAGESJAUNES_FR_ACTOR_IDS = new Set([
  "k8l0gs6zbd7vmbldj", // PagesJaunes.fr scraper (store)
]);

function compactApifyActorKey(actorId: string | null | undefined): string {
  return (actorId ?? "").trim().replace(/[~\\/]/g, "").toLowerCase();
}

export function resolveYellowPagesApifyInputProfile(actorId: string | null): YellowPagesApifyInputProfile {
  const fromEnv = process.env.APIFY_YELLOW_PAGES_INPUT_PROFILE?.trim().toLowerCase();
  if (fromEnv === "trudax_us" || fromEnv === "google_maps_compat" || fromEnv === "pagesjaunes_fr") {
    return fromEnv;
  }
  const id = (actorId ?? "").toLowerCase();
  const compact = compactApifyActorKey(actorId);

  if (TRUDAX_STYLE_YELLOW_PAGES_ACTOR_IDS.has(compact)) {
    return "trudax_us";
  }
  if (id.includes("yellow-pages-us") || id.includes("yellowpages-us")) {
    return "trudax_us";
  }
  if (id.includes("trudax/") || id.includes("trudax~")) {
    return "trudax_us";
  }

  if (
    PAGESJAUNES_FR_ACTOR_IDS.has(compact) ||
    id.includes("memo23/") ||
    id.includes("memo23~") ||
    id.includes("pagesjaunes-scraper") ||
    id.includes("pagesjaunes_scraper")
  ) {
    return "pagesjaunes_fr";
  }

  return "google_maps_compat";
}

/** Actor LinkedIn / entreprises (optionnel — enrichissement haut score uniquement). */
export function getLinkedInEnrichmentActorId(): string | null {
  const actorId = process.env.APIFY_LINKEDIN_ENRICHMENT_ACTOR_ID?.trim();
  return actorId || null;
}

/**
 * Profil d’input enrichissement LinkedIn : `companies` (objets { name, city }) ou `targets` + `maxEmployees` + `proxyConfiguration`
 * (schéma officiel linkedin-company-employees-scraper — champ requis `targets`, pas `urls`).
 * Détection auto : slug scraper-engine, ou ID store connu ; sinon APIFY_LINKEDIN_ENRICHMENT_INPUT_PROFILE.
 */
export type LinkedInEnrichmentApifyInputProfile = "companies" | "targets" | "profile_urls";

/** IDs store bruts pour scraper-engine/linkedin-company-employees-scraper (le slug n’apparaît pas dans l’ID). */
const LINKEDIN_COMPANY_EMPLOYEES_KNOWN_ACTOR_IDS = new Set([
  "2imkedi6d9zzylmdx", // linkedin-company-employees-scraper (schéma : targets + maxEmployees + proxyConfiguration)
]);

/** Mass LinkedIn Profile Scraper (profileUrls) — dev_fusion/Linkedin-Profile-Scraper */
const LINKEDIN_PROFILE_SCRAPER_KNOWN_ACTOR_IDS = new Set([
  "2syf0bvxmggr8ivcz", // store ID 2SyF0bVxmgGr8IVCZ
]);

export function resolveLinkedInEnrichmentApifyInputProfile(
  actorId: string | null,
): LinkedInEnrichmentApifyInputProfile {
  const fromEnv = process.env.APIFY_LINKEDIN_ENRICHMENT_INPUT_PROFILE?.trim().toLowerCase();
  if (fromEnv === "companies" || fromEnv === "targets" || fromEnv === "profile_urls") {
    return fromEnv;
  }
  if (LINKEDIN_COMPANY_EMPLOYEES_KNOWN_ACTOR_IDS.has(compactApifyActorKey(actorId))) {
    return "targets";
  }
  if (LINKEDIN_PROFILE_SCRAPER_KNOWN_ACTOR_IDS.has(compactApifyActorKey(actorId))) {
    return "profile_urls";
  }
  const id = (actorId ?? "").toLowerCase();
  if (id.includes("linkedin-profile-scraper") || id.includes("dev_fusion")) {
    return "profile_urls";
  }
  if (
    id.includes("linkedin-company-employees") ||
    id.includes("scraper-engine/") ||
    id.includes("scraper-engine~")
  ) {
    return "targets";
  }
  return "companies";
}

/** Proxy Apify recommandé pour les actors LinkedIn (évite des runs « silencieux » / blocages). */
export function buildLinkedInEnrichmentApifyProxyConfiguration(): Record<string, unknown> {
  return { useApifyProxy: true };
}

export function getApifyEnv(): { token: string; actorId: string } {
  return { token: getApifyToken(), actorId: getGoogleMapsActorId() };
}

/** `username/actor-name` → `username~actor-name` (format attendu par l’API Apify). */
export function normalizeApifyActorId(actorId: string): string {
  return actorId.trim().replace(/\//g, "~");
}

function apifyResponseLooksLikeHtml(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    t.startsWith("<!doctype") ||
    t.startsWith("<html") ||
    (t.includes("<html") && t.includes("</html>")) ||
    (t.includes("<title") && t.includes("</title>"))
  );
}

function extractHtmlTitle(text: string): string | null {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(text);
  const s = m?.[1]?.replace(/\s+/g, " ").trim();
  return s || null;
}

/**
 * Corps d’erreur HTTP Apify : JSON si possible, sinon texte court (jamais une page HTML complète).
 */
async function readApifyErrorMessage(res: Response): Promise<string> {
  try {
    const text = await res.text();
    const st = res.status;
    if (!text) {
      if (st === 502) return "502 Bad Gateway — API Apify ou réseau intermédiaire temporairement indisponible.";
      if (st === 503) return "503 — service Apify surchargé ou en maintenance.";
      if (st === 504) return "504 Gateway Timeout — réessayez.";
      return res.statusText || String(st);
    }
    try {
      const j = JSON.parse(text) as {
        error?: { message?: string };
        message?: string;
      };
      if (j?.error?.message) return j.error.message;
      if (typeof j?.message === "string") return j.message;
    } catch {
      /* pas du JSON */
    }
    if (apifyResponseLooksLikeHtml(text)) {
      const title = extractHtmlTitle(text);
      if (title) return title;
      if (st === 502) return "502 Bad Gateway — API Apify temporairement injoignable. Réessayez dans quelques minutes.";
      if (st === 503) return "503 — service indisponible. Réessayez plus tard.";
      if (st === 504) return "504 — délai dépassé. Réessayez.";
      return "Réponse HTML inattendue (serveur ou proxy) au lieu d’une erreur JSON Apify.";
    }
    const plain = text.replace(/\s+/g, " ").trim();
    return plain.length > 400 ? `${plain.slice(0, 400)}…` : plain;
  } catch {
    return res.statusText || String(res.status);
  }
}

async function apifyFetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await readApifyErrorMessage(res);
    throw new Error(`Apify (${res.status}) : ${msg}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Démarre un run d’actor. Le corps HTTP est l’input JSON de l’actor (pas de wrapper `runInput`).
 * @see https://docs.apify.com/api/v2/act-runs-post
 */
export async function getApifyDatasetItemCount(token: string, datasetId: string): Promise<number | null> {
  try {
    const url = `${APIFY_API_BASE}/datasets/${encodeURIComponent(datasetId)}?token=${encodeURIComponent(token)}`;
    const env = await apifyFetchJson<ApifyEnvelope<{ itemCount?: number }>>(url);
    const n = env?.data?.itemCount;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function startApifyActorRun(
  token: string,
  actorId: string,
  runInput: Record<string, unknown>,
): Promise<ApifyActorRunData> {
  const id = normalizeApifyActorId(actorId);
  const url = `${APIFY_API_BASE}/acts/${encodeURIComponent(id)}/runs?token=${encodeURIComponent(token)}`;
  const body = JSON.stringify(runInput);
  console.info("[apify] Démarrage run", { actorId: id, input: runInput });
  const env = await apifyFetchJson<ApifyEnvelope<ApifyActorRunData>>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!env?.data?.id) {
    throw new Error("Réponse Apify invalide : run sans identifiant.");
  }
  const data = env.data;
  const dsId = data.defaultDatasetId ?? "";
  let datasetItemCount: number | null = null;
  if (dsId) {
    datasetItemCount = await getApifyDatasetItemCount(token, dsId);
  }
  console.info("[apify] Run créé", {
    actorId: id,
    runId: data.id,
    status: data.status ?? null,
    defaultDatasetId: dsId || null,
    datasetItemCount,
  });
  return data;
}

export async function getApifyRun(token: string, runId: string): Promise<ApifyActorRunData> {
  const url = `${APIFY_API_BASE}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`;
  const env = await apifyFetchJson<ApifyEnvelope<ApifyActorRunData>>(url);
  if (!env?.data) {
    throw new Error("Réponse Apify invalide : run introuvable.");
  }
  return env.data;
}

const TERMINAL_OK = new Set(["SUCCEEDED"]);
const TERMINAL_FAIL = new Set(["FAILED", "ABORTED", "TIMED-OUT"]);

export function isApifyRunFinished(status: string): "running" | "ok" | "fail" {
  const s = status.toUpperCase();
  if (TERMINAL_OK.has(s)) return "ok";
  if (TERMINAL_FAIL.has(s)) return "fail";
  return "running";
}

/**
 * Récupère tous les items du dataset (pagination offset/limit).
 */
export async function getApifyDatasetItems(token: string, datasetId: string): Promise<unknown[]> {
  const pageSize = 1000;
  const out: unknown[] = [];
  let offset = 0;
  for (;;) {
    const url = `${APIFY_API_BASE}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(
      token,
    )}&format=json&clean=1&offset=${offset}&limit=${pageSize}`;
    const chunk = await apifyFetchJson<unknown>(url);
    const items = Array.isArray(chunk) ? chunk : [];
    if (items.length === 0) break;
    out.push(...items);
    if (items.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}
