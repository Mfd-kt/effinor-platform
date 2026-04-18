import type { LeadGenerationStockRow } from "../domain/stock-row";

const MAX_PAGES = 5;

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Pages susceptibles de mentionner équipe / direction (même origine que le site).
 */
export function buildDecisionMakerScrapeUrls(row: LeadGenerationStockRow): string[] {
  const urls: string[] = [];
  const add = (raw: string) => {
    try {
      const u = raw.includes("://") ? raw : `https://${raw.replace(/^\/\//, "")}`;
      const parsed = new URL(u);
      if (!parsed.hostname) return;
      const href = parsed.href.replace(/\/$/, "");
      if (!urls.includes(href)) urls.push(href);
    } catch {
      /* ignore */
    }
  };

  if (hasText(row.website)) add(row.website!.trim());
  if (urls.length < MAX_PAGES && hasText(row.enriched_website)) add(row.enriched_website!.trim());

  const dom = row.enriched_domain?.trim() || row.normalized_domain?.trim();
  let origin: string | null = null;
  if (urls.length > 0) {
    try {
      origin = new URL(urls[0]!).origin;
    } catch {
      origin = null;
    }
  } else if (dom) {
    const host = dom.replace(/^https?:\/\//i, "").split("/")[0]?.trim();
    if (host) {
      add(`https://${host}`);
      try {
        origin = new URL(urls[0]!).origin;
      } catch {
        origin = null;
      }
    }
  }

  if (!origin && urls.length > 0) {
    try {
      origin = new URL(urls[0]!).origin;
    } catch {
      /* */
    }
  }

  if (origin) {
    const paths = [
      "/a-propos",
      "/about",
      "/qui-sommes-nous",
      "/equipe",
      "/équipe",
      "/team",
      "/notre-equipe",
      "/contact",
    ];
    for (const p of paths) {
      if (urls.length >= MAX_PAGES) break;
      const next = `${origin}${p}`;
      if (!urls.includes(next)) add(next);
    }
  }

  return urls.slice(0, MAX_PAGES);
}
