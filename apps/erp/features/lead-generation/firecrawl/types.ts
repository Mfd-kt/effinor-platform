/** Réponse minimale POST https://api.firecrawl.dev/v1/scrape */
export type FirecrawlScrapeResponse = {
  success?: boolean;
  error?: string;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      sourceURL?: string;
      url?: string;
      title?: string;
    };
  };
};
