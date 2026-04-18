import type { LeadGenerationStockRow } from "../domain/stock-row";

const MAX_PAGES = 3;

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Ordre : site source → site suggéré → racine domaine → /contact (même origine).
 * Max 3 URLs distinctes.
 */
export function buildVerifiedScrapeUrls(row: LeadGenerationStockRow): string[] {
  const urls: string[] = [];
  const add = (raw: string) => {
    try {
      const u = raw.includes("://") ? raw : `https://${raw.replace(/^\/\//, "")}`;
      const parsed = new URL(u);
      if (!parsed.hostname) return;
      const href = parsed.href;
      if (!urls.includes(href)) urls.push(href);
    } catch {
      /* ignore */
    }
  };

  if (hasText(row.website)) {
    add(row.website!.trim());
  }
  if (urls.length < MAX_PAGES && hasText(row.enriched_website)) {
    add(row.enriched_website!.trim());
  }
  const dom = row.enriched_domain?.trim() || row.normalized_domain?.trim();
  if (urls.length < MAX_PAGES && dom) {
    const host = dom.replace(/^https?:\/\//i, "").split("/")[0]?.trim();
    if (host) add(`https://${host}`);
  }

  if (urls.length > 0 && urls.length < MAX_PAGES) {
    try {
      const origin = new URL(urls[0]!).origin;
      const contact = `${origin}/contact`;
      if (!urls.includes(contact)) add(contact);
    } catch {
      /* */
    }
  }

  return urls.slice(0, MAX_PAGES);
}
