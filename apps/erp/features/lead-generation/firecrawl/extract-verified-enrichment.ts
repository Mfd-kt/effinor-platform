import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationEnrichmentConfidence } from "../domain/statuses";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { isEligibleForVerifiedLeadGenerationEnrichment } from "../enrichment/verified-enrichment-eligibility";
import { normalizeDomain } from "../lib/normalize-domain";
import { lgTable } from "../lib/lg-db";
import { scrapeFirecrawlUrl } from "./client";
import { buildVerifiedScrapeUrls } from "./verified-scrape-urls";

const SPAM_EMAIL_DOMAINS = new Set([
  "example.com",
  "test.com",
  "localhost",
  "domain.com",
  "email.com",
  "yourdomain.com",
]);

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function extractEmailsFromText(text: string): string[] {
  const found = text.match(EMAIL_RE) ?? [];
  const out: string[] = [];
  for (const e of found) {
    const lower = e.toLowerCase().trim();
    const dom = lower.split("@")[1];
    if (!dom || SPAM_EMAIL_DOMAINS.has(dom)) continue;
    if (!out.includes(lower)) out.push(lower);
  }
  return out;
}

function pickBestPublicEmail(emails: string[], pageHosts: Set<string>): string | null {
  if (emails.length === 0) return null;
  for (const e of emails) {
    const dom = e.split("@")[1]?.toLowerCase();
    if (dom && pageHosts.has(dom)) return e;
  }
  return emails[0] ?? null;
}

function hostSetFromUrls(urls: string[]): Set<string> {
  const s = new Set<string>();
  for (const u of urls) {
    try {
      s.add(new URL(u).hostname.toLowerCase().replace(/^www\./, ""));
    } catch {
      /* */
    }
  }
  return s;
}

export type ExtractVerifiedLeadGenerationEnrichmentResult = {
  stockId: string;
  status: "completed" | "failed";
  enrichment_confidence?: LeadGenerationEnrichmentConfidence;
  enriched_email?: string | null;
  enriched_domain?: string | null;
  enriched_website?: string | null;
  error?: string;
};

type EnrichmentSnapshot = Pick<
  LeadGenerationStockRow,
  | "enrichment_status"
  | "enrichment_confidence"
  | "enriched_email"
  | "enriched_domain"
  | "enriched_website"
  | "enrichment_source"
>;

async function loadStockRow(stockId: string): Promise<LeadGenerationStockRow | null> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");
  const { data, error } = await stock.select("*").eq("id", stockId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as LeadGenerationStockRow | null;
}

function snapshotEnrichment(row: LeadGenerationStockRow): EnrichmentSnapshot {
  return {
    enrichment_status: row.enrichment_status,
    enrichment_confidence: row.enrichment_confidence,
    enriched_email: row.enriched_email,
    enriched_domain: row.enriched_domain,
    enriched_website: row.enriched_website,
    enrichment_source: row.enrichment_source,
  };
}

/**
 * Étape 11 — lecture ciblée (1–3 pages) via Firecrawl, extraction d’emails / indices publics uniquement.
 * Ne génère jamais d’email inventé. Ne dégrade jamais une confiance `high`.
 */
export async function extractVerifiedLeadGenerationEnrichment(input: {
  stockId: string;
}): Promise<ExtractVerifiedLeadGenerationEnrichmentResult> {
  const { stockId } = input;
  const row = await loadStockRow(stockId);
  if (!row) {
    return { stockId, status: "failed", error: "Fiche introuvable." };
  }

  if (row.enrichment_confidence === "high") {
    return { stockId, status: "failed", error: "Données déjà au niveau de confiance maximal." };
  }

  const elig = isEligibleForVerifiedLeadGenerationEnrichment(row);
  if (!elig.ok) {
    return { stockId, status: "failed", error: elig.reason };
  }

  const urls = buildVerifiedScrapeUrls(row);
  if (urls.length === 0) {
    return {
      stockId,
      status: "failed",
      error: "Aucune URL publique à analyser (indiquez un site ou un domaine exploitable).",
    };
  }

  const before = snapshotEnrichment(row);
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const { data: locked, error: lockErr } = await stock
    .update({
      enrichment_status: "in_progress",
      enrichment_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stockId)
    .neq("enrichment_status", "in_progress")
    .select("id")
    .maybeSingle();

  if (lockErr) {
    return { stockId, status: "failed", error: lockErr.message };
  }
  if (!locked) {
    return { stockId, status: "failed", error: "Une opération est déjà en cours sur cette fiche." };
  }

  const restore = async (errorMessage: string) => {
    await stock
      .update({
        enrichment_status: before.enrichment_status,
        enrichment_confidence: before.enrichment_confidence,
        enriched_email: before.enriched_email,
        enriched_domain: before.enriched_domain,
        enriched_website: before.enriched_website,
        enrichment_source: before.enrichment_source,
        enrichment_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stockId);
  };

  try {
    const pageHosts = hostSetFromUrls(urls);
    let combined = "";
    let lastResolvedUrl = urls[0]!;

    for (const url of urls) {
      const res = await scrapeFirecrawlUrl({ url });
      const md = res.data?.markdown?.trim() ?? "";
      const metaUrl = res.data?.metadata?.sourceURL || res.data?.metadata?.url;
      if (metaUrl) {
        try {
          lastResolvedUrl = metaUrl;
        } catch {
          /* */
        }
      }
      if (md) {
        combined += `\n\n${md}`;
      }
    }

    if (!combined.trim()) {
      await restore("Aucun contenu texte récupéré sur les pages tentées.");
      return {
        stockId,
        status: "failed",
        error: "Aucun contenu public exploitable sur les pages analysées.",
      };
    }

    const emails = extractEmailsFromText(combined);
    const bestEmail = pickBestPublicEmail(emails, pageHosts);

    let resolvedOrigin: string;
    try {
      resolvedOrigin = new URL(lastResolvedUrl).origin;
    } catch {
      resolvedOrigin = new URL(urls[0]!).origin;
    }
    const host =
      normalizeDomain(resolvedOrigin) ?? normalizeDomain(lastResolvedUrl) ?? row.enriched_domain ?? row.normalized_domain;

    let confidence: LeadGenerationEnrichmentConfidence;
    let enriched_email: string | null;
    let enriched_domain: string | null;
    let enriched_website: string | null;

    /** Mini-étape 11.1 : `high` = preuve forte (email public extrait). Pas de `high` sur seul repère téléphone. */
    if (bestEmail) {
      confidence = "high";
      enriched_email = bestEmail;
      const ed = bestEmail.split("@")[1]?.toLowerCase() ?? null;
      enriched_domain = ed;
      enriched_website = ed ? `https://${ed}` : resolvedOrigin;
    } else if (host && combined.trim().length >= 40) {
      confidence = "medium";
      enriched_domain = host;
      enriched_website = resolvedOrigin;
      enriched_email = null;
    } else {
      await restore("Données insuffisantes après lecture des pages publiques.");
      return {
        stockId,
        status: "failed",
        error: "Aucun email public identifié et contenu trop pauvre pour confirmer le site.",
      };
    }

    const now = new Date().toISOString();
    const { error: upErr } = await stock
      .update({
        enrichment_status: "completed",
        enriched_at: now,
        enrichment_error: null,
        enriched_email,
        enriched_domain,
        enriched_website,
        enrichment_confidence: confidence,
        enrichment_source: "firecrawl",
        updated_at: now,
      })
      .eq("id", stockId);

    if (upErr) {
      await restore(upErr.message);
      return { stockId, status: "failed", error: upErr.message };
    }

    return {
      stockId,
      status: "completed",
      enrichment_confidence: confidence,
      enriched_email,
      enriched_domain,
      enriched_website,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inattendue.";
    await restore(msg);
    return { stockId, status: "failed", error: msg };
  }
}

export async function extractVerifiedLeadGenerationEnrichmentBatch(
  stockIds: string[],
): Promise<{ processed: number; details: ExtractVerifiedLeadGenerationEnrichmentResult[] }> {
  const details: ExtractVerifiedLeadGenerationEnrichmentResult[] = [];
  for (const stockId of stockIds) {
    details.push(await extractVerifiedLeadGenerationEnrichment({ stockId }));
  }
  return { processed: stockIds.length, details };
}
